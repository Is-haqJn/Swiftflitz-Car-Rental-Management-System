# Swiftflitz Payment & Notification Implementation Diagrams

---

## 1. Online Payment Initiation Flow (Hubtel)

```mermaid
sequenceDiagram
    participant C as Customer (Browser)
    participant FE as Frontend<br/>(PaymentPage)
    participant API as Backend API<br/>(PaymentController)
    participant PS as PaymentService
    participant HA as HubtelAdapter
    participant DB as Database<br/>(PaymentTransaction)
    participant HUB as Hubtel API<br/>(payproxyapi.hubtel.com)

    C->>FE: Opens payment link<br/>/payment/rental/{id}?email=...
    FE->>API: GET /api/v1/payments/payable-amount<br/>?transactable_type=rental&transactable_id={id}
    API-->>FE: { amount, currency, customer_profile_complete }

    C->>FE: Fills form (name, email, phone) and clicks Pay
    FE->>API: POST /api/v1/payments/initiate<br/>{ transactable_type, transactable_id, payer_name, ... }
    API->>PS: initiate(PaymentInitiateData)
    PS->>PS: resolvePayableAmount() - override client amount with DB value
    PS->>HA: initiate(secureData)
    HA->>HUB: POST /items/initiate<br/>{ totalAmount, merchantAccountNumber,<br/>callbackUrl, returnUrl, cancellationUrl,<br/>payeeName, payeeMobileNumber, payeeEmail }
    HUB-->>HA: { data.checkoutUrl, data.checkoutId, clientReference }
    HA-->>PS: PaymentResult { success, reference, authorizationUrl }
    PS->>DB: INSERT PaymentTransaction<br/>status=pending, provider=hubtel<br/>(If purpose=damage, UPDATES existing RepairCost instead)
    PS-->>API: PaymentResult
    API-->>FE: { reference, authorization_url }
    FE->>C: Redirect to Hubtel checkout page (checkoutUrl)
```

---

## 2. Payment Completion - Webhook Path (Happy Path)

```mermaid
sequenceDiagram
    participant C as Customer
    participant HUB as Hubtel
    participant API as Backend API<br/>(webhook endpoint)
    participant PS as PaymentService
    participant HA as HubtelAdapter
    participant DB as Database
    participant EV as Event/Notification<br/>Pipeline

    C->>HUB: Completes mobile money payment
    HUB->>HUB: Processes transaction
    HUB->>API: POST /api/v1/payments/webhook/hubtel<br/>{ ResponseCode:"0000", Status:"Success",<br/>Data: { ClientReference, Status, Amount, ... } }
    API->>PS: handleWebhook("hubtel", request)
    PS->>HA: handleWebhook(request)<br/>→ checks ResponseCode=0000 && Status=Success
    HA-->>PS: true (valid)
    PS->>PS: extractReferenceFromWebhook()<br/>→ Data.ClientReference
    PS->>DB: Find PaymentTransaction by reference
    PS->>PS: buildVerifyResultFromHubtelWebhook(request)<br/>→ extract status, channel, paymentPhone (Fallback)
    PS->>HA: verify(reference)<br/>→ GET api-txnstatus.hubtel.com/transactions/{merchantId}/status
    alt verify() API call succeeds
        HA-->>PS: PaymentVerifyResult from Hubtel API
    else verify() fails (e.g. absent IP whitelist)
        HA--xPS: Exception / Timeout
        PS->>PS: Use Fallback PaymentVerifyResult from payload
    end
    PS->>DB: UPDATE PaymentTransaction<br/>status=paid, paid_at=now(), channel, payment_phone
    PS->>EV: event(PaymentStatusUpdated)
    EV->>EV: SendPaymentConfirmationJob dispatched
    EV-->>C: Email + SMS payment confirmation
    HUB->>C: Redirect to returnUrl<br/>/payment/rental/{id}?status=success&reference=...

    Note over C,API: Polling via generic DB-only status endpoint (no whitelist needed)
    C->>API: GET /api/v1/payments/status/{reference} (every 15s)
    API-->>C: { status:"paid" } - page shows success
```

---

## 3. Mandatory 5-Minute Status Check (Hubtel Fallback)

> Required by Hubtel: if no webhook is received within 5 minutes, the merchant MUST call the status check API.

```mermaid
sequenceDiagram
    participant SCHED as Laravel Scheduler<br/>(every 5 min)
    participant JOB as CheckPendingHubtelPaymentsJob
    participant PS as PaymentService
    participant HA as HubtelAdapter
    participant DB as Database
    participant TX as api-txnstatus.hubtel.com
    participant EV as Event Pipeline

    SCHED->>JOB: dispatch (everyFiveMinutes)
    JOB->>DB: SELECT * FROM payment_transactions<br/>WHERE provider=hubtel<br/>AND status=pending<br/>AND created_at <= now()-5min<br/>AND created_at >= now()-24h
    DB-->>JOB: [ stale transactions ]

    loop For each stale transaction
        JOB->>PS: verify(reference)
        PS->>HA: verify(reference)
        HA->>TX: GET /transactions/{merchantId}/status<br/>?clientReference={reference}
        TX-->>HA: { responseCode, data.status:"Paid"|"Unpaid" }
        HA-->>PS: PaymentVerifyResult
        alt status = Paid
            PS->>DB: UPDATE status=paid, paid_at=now()
            PS->>EV: event(PaymentStatusUpdated)
            EV-->>EV: Confirmation notifications dispatched
        else status = Unpaid / still pending
            PS->>DB: No change (stays pending)
        end
    end
```

---

## 4. Payment Cancellation Flow

```mermaid
sequenceDiagram
    participant C as Customer
    participant HUB as Hubtel Checkout
    participant FE as Frontend<br/>(PaymentCancelledPage)

    C->>HUB: Clicks "Cancel" on Hubtel checkout page
    HUB->>FE: Redirect to cancellationUrl<br/>/payment/cancelled?reference={ref}
    FE->>C: Shows "Payment Cancelled" page<br/>with reference badge + Try Again / Contact Support
    Note over FE: PaymentTransaction stays<br/>status=pending until the<br/>5-min job marks it stale<br/>or it expires after 24h
```

---

## 5. Admin "Send Payment Link" Flow

```mermaid
sequenceDiagram
    participant ADMIN as Admin User<br/>(RentalDetail page)
    participant FE as Frontend
    participant API as Backend API<br/>(RentalController)
    participant RS as RentalService
    participant MAIL as Mail Queue
    participant C as Customer (Email)
    participant FE2 as PaymentPage

    ADMIN->>FE: Clicks "Send Payment Link"<br/>(button visible when payment_status=pending/partially_paid)
    FE->>ADMIN: Shows confirmation modal<br/>{ customerName, email, amountDue, reference }
    ADMIN->>FE: Clicks "Send Link"
    FE->>API: POST /api/v1/rentals/{id}/send-payment-link
    API->>API: authorize("sendPaymentLink", rental)<br/>→ checks rentals.send_payment_link permission
    API->>RS: sendPaymentLink(rental)
    RS->>RS: Compute amountDue = total_cost - amount_paid
    RS->>RS: Build paymentUrl:<br/>/payment/rental/{id}?name=...&email=...&phone=...&booking_ref=...
    RS->>MAIL: Mail::to(email)->queue(PaymentLinkMail)
    MAIL-->>C: Email with "Pay Now" button → paymentUrl
    API-->>FE: { message: "Payment link sent to customer." }
    FE-->>ADMIN: Toast success
    C->>FE2: Opens link → PaymentPage pre-filled with customer details
```

---

## 6. Hubtel SMS Notification Flow

```mermaid
sequenceDiagram
    participant SVC as Any Service<br/>(e.g. RentalService)
    participant EV as Event
    participant LIS as Listener
    participant JOB as Notification Job
    participant NS as NotificationService
    participant SMS as SmsNotificationService
    participant CH as SmsChannel
    participant ADP as HubtelSmsAdapter
    participant HUB as sms.hubtel.com

    SVC->>EV: fire Event (e.g. RentalCreated)
    EV->>LIS: Listener::handle()
    LIS->>JOB: dispatch Job
    JOB->>NS: send(user, type, data)
    NS->>NS: shouldSend() checks:<br/>1. SmsSettings.send_{type}<br/>2. NotificationSystemSettings.sms_{type}
    NS->>SMS: notify{Type}(booking, recipient)
    SMS->>SMS: SmsTemplateService renders template<br/>(named {{variables}} replaced)
    SMS->>CH: SmsChannel::send(to, message)
    CH->>CH: resolveProvider() → 'hubtel'
    CH->>ADP: HubtelSmsAdapter::send(to, message)
    ADP->>HUB: POST /v1/messages/send<br/>Authorization: Basic {clientId:clientSecret}<br/>{ From, To, Content }
    HUB-->>ADP: { status:0, messageId, statusDescription }
    ADP-->>CH: true (success)
```

---

## 7. Transaction Recording Lifecycle (RentalService)

```mermaid
flowchart TD
    A[Rental Created] --> B{amount_paid > 0?}
    B -- Yes --> C[recordManualTransaction\ntype=manual, status=paid]
    B -- No --> D{collectDepositNow?}
    C --> D
    D -- Yes --> E[recordRefundTransaction\ntype=security_deposit\nprefix=DEP-]
    D -- No --> F[Rental Active]

    F --> G[processPickup]
    G --> H{collect_deposit=true?}
    H -- Yes --> I[recordRefundTransaction\ntype=security_deposit]
    H -- No --> J{payment at pickup?}
    I --> J
    J -- Yes --> K[recordManualTransaction]
    J -- No --> L[Picked Up]
    K --> L

    L --> M[processReturn]
    M --> N{payment at return?}
    N -- Yes --> O[recordManualTransaction]
    N -- No --> P[Returned / Awaiting Approval]
    O --> P

    P --> Q{approveReturn}
    Q --> R{deposit held?}
    R -- Yes --> S[recordRefundTransaction\ntype=deposit_refund\nprefix=DEP-]
    R -- No --> T[Completed]
    S --> T

    T --> U{settleRefund action?}
    U -- approved --> V[recordRefundTransaction\ntype=refund REF-]
    U -- mark_received --> W[recordRefundTransaction\ntype=cancellation_fee CANC-]
    U -- deduct_deposit --> X[recordRefundTransaction\ntype=cancellation_fee CANC-]
    U -- waived/waive_debt --> Y[No transaction recorded]

    style C fill:#86efac
    style E fill:#86efac
    style I fill:#86efac
    style K fill:#86efac
    style O fill:#86efac
    style S fill:#86efac
    style V fill:#86efac
    style W fill:#86efac
    style X fill:#86efac
    style Y fill:#fca5a5
```

---

## 8. Damage & Repair Transaction Lifecycle

```mermaid
sequenceDiagram
    participant ADMIN as Admin
    participant RS as RentalService
    participant DB as PaymentTransaction

    ADMIN->>RS: recordRepairCost(id, estimated_cost)
    RS->>DB: INSERT type=repair_cost<br/>status=PENDING, amount=estimated_cost<br/>reference=DMG-xxxxx

    Note over DB: Estimate sits as pending<br/>until damage is settled

    alt settleDamage - prior estimate exists
        ADMIN->>RS: settleDamage(id, actual_cost)
        RS->>DB: Find pending repair_cost transaction
        RS->>DB: UPDATE status=paid<br/>amount=actual_cost, paid_at=now()
    else settleDamage - no prior estimate
        ADMIN->>RS: settleDamage(id, amount)
        RS->>DB: INSERT type=damage_charge<br/>status=paid, reference=DMG-xxxxx
    end

    alt collectDamageBalance
        ADMIN->>RS: collectDamageBalance(id)
        RS->>DB: INSERT type=damage_charge<br/>status=paid, reference=DMG-xxxxx
    end
```

---

## 9. Online Damage Payment Flow (`purpose=damage`)

```mermaid
sequenceDiagram
    participant C as Customer
    participant FE as PaymentPage
    participant API as Backend API
    participant PS as PaymentService
    participant DB as Database<br/>(PaymentTransaction)
    participant LIS as MarkTransactableAsPaid

    C->>FE: Opens payment link with ?purpose=damage
    FE->>API: POST /api/v1/payments/initiate<br/>{ purpose:"damage" }
    API->>PS: initiate(PaymentInitiateData)
    PS->>PS: resolvePayableAmount()<br/>→ uses damage_balance_due or estimate
    PS->>DB: Query existing pending RepairCost<br/>for the rental
    alt finds pending estimate
        PS->>DB: UPDATE transaction (reuse it)<br/>set provider, reference, payer stats
    else no pending estimate
        PS->>DB: INSERT new transaction
    end
    PS-->>API: PaymentResult { authorizationUrl }
    API-->>FE: Return URL
    FE->>C: Redirect to checkout

    Note over C, LIS: Customer pays & webhook arrives
    API->>PS: Webhook or Status Polling<br/>marks transaction status=paid
    PS->>LIS: event(PaymentStatusUpdated)
    LIS->>LIS: Check transaction metadata['purpose'] == 'damage'
    alt damage payment
        LIS->>DB: DB::transaction()
        LIS->>DB: Soft delete any duplicate pending RepairCost
        LIS->>DB: UPDATE rental: damage_balance_due = null,<br/>damage_settlement_status = 'settled'
        LIS->>DB: Tag transaction type = 'DamageCharge'
        LIS->>DB: commit()
    else normal payment
        LIS->>DB: UPDATE total_paid, payment_status, balance
    end
```
