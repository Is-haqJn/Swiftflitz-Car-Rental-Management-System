# Hubtel Payment Workflows (Technical)

These diagrams outline the technical flow of the Hubtel payment integration, highlighting classes, API endpoints, payload data, and database interactions.

---

## 1. Payment Initiation (Hubtel Checkout)

The technical process of generating a Hubtel checkout URL from the frontend request.

```mermaid
sequenceDiagram
    participant FE as Frontend<br/>(PaymentPage)
    participant API as Backend API<br/>(PaymentController)
    participant PS as PaymentService
    participant HA as HubtelAdapter
    participant DB as Database<br/>(PaymentTransaction)
    participant HUB as Hubtel API<br/>(payproxyapi.hubtel.com)

    FE->>API: POST /api/v1/payments/initiate<br/>{ transactable_type, transactable_id, payer_name, ... }
    API->>PS: initiate(PaymentInitiateData)
    PS->>PS: resolvePayableAmount() - override client amount with DB value
    PS->>HA: initiate(secureData)
    
    HA->>HUB: POST /items/initiate<br/>{ totalAmount, merchantAccountNumber, callbackUrl, ... }
    HUB-->>HA: { data.checkoutUrl, data.checkoutId, clientReference }
    
    HA-->>PS: PaymentResult { success, reference, authorizationUrl }
    PS->>DB: INSERT PaymentTransaction<br/>status=pending, provider=hubtel
    PS-->>API: PaymentResult
    API-->>FE: { reference, authorization_url }

    Note over FE, HUB: Customer is redirected to the returned authorization_url
```

---

## 2. Successful Payment (Webhook Callback & DB-Only Polling)

How the system securely receives payment confirmation from Hubtel. If the Transaction Status Check API is unreachable (IP not whitelisted), the payment is flagged for admin review instead of auto-marking paid.

```mermaid
sequenceDiagram
    participant FE as Frontend<br/>(Polling)
    participant HUB as Hubtel
    participant API as Backend API
    participant PS as PaymentService
    participant HA as HubtelAdapter
    participant DB as Database
    participant EV as Event Listener

    HUB->>API: POST /api/v1/payments/webhook/hubtel<br/>{ ResponseCode:"0000", Status:"Success", Data: {...} }
    API->>PS: handleWebhook("hubtel", request)
    PS->>HA: handleWebhook(request)<br/>→ checks ResponseCode=0000 && Status=Success
    
    PS->>PS: buildVerifyResultFromHubtelWebhook(request)<br/>→ extract status, channel, paymentPhone (Fallback)
    
    PS->>HA: verify(reference)<br/>→ GET api-txnstatus.hubtel.com/transactions/.../status
    alt verify() API call succeeds
        HA-->>PS: PaymentVerifyResult from Hubtel API
        PS->>DB: UPDATE PaymentTransaction<br/>status=paid, paid_at=now(), channel, payment_phone
        PS->>API: event(PaymentStatusUpdated)
        Note over API: Broadcasts via Reverb to Frontend
        API->>EV: Catches PaymentStatusUpdated
        EV->>API: Dispatches Notification Jobs (SMS, Email)
    else verify() fails (e.g. IP not whitelisted)
        HA--xPS: Exception / Timeout / 403
        PS->>DB: UPDATE status=under_review
        PS->>PS: dispatch SendUnderReviewNotificationJob
        Note over PS: Admin resolves via<br/>POST /api/v1/transactions/{tx}/resolve<br/>(action: approve or reject)
    end

    %% DB Polling Loop
    loop Every 15 seconds
        FE->>API: GET /api/v1/payments/status/{reference}
        API->>DB: SELECT status FROM payment_transactions
        API-->>FE: { status:"paid" } - Frontend redirects to success
    end
```

---

## 3. Mandatory 5-Minute Status Check (Job Fallback)

Hubtel's required polling fallback to catch missed webhooks.

```mermaid
sequenceDiagram
    participant SCHED as Laravel Scheduler<br/>(every 5 min)
    participant JOB as CheckPendingHubtelPaymentsJob
    participant PS as PaymentService
    participant HA as HubtelAdapter
    participant TX as api-txnstatus.hubtel.com
    participant DB as Database

    SCHED->>JOB: dispatch
    JOB->>DB: SELECT * FROM payment_transactions<br/>WHERE provider=hubtel AND status=pending<br/>AND created_at <= now()-5min
    
    loop For each stale transaction
        JOB->>PS: verify(reference)
        PS->>HA: verify(reference)
        HA->>TX: GET /transactions/{merchantId}/status?clientReference={reference}
        TX-->>HA: { responseCode, data.status:"Paid" }
        
        alt status = Paid
            PS->>DB: UPDATE status=paid, paid_at=now()
            PS->>PS: event(PaymentStatusUpdated)
        else status = Unpaid
            PS->>DB: No change (stays pending)
        end
    end
```

---

## 4. Online Damage Payment Transaction Flow (`purpose=damage`)

How the system intercepts damage payments to prevent duplicate invoice records from being generated.

```mermaid
sequenceDiagram
    participant FE as PaymentPage
    participant API as Backend API
    participant PS as PaymentService
    participant DB as Database<br/>(PaymentTransaction)
    participant LIS as MarkTransactableAsPaid

    FE->>API: POST /api/v1/payments/initiate<br/>{ purpose:"damage" }
    API->>PS: initiate(PaymentInitiateData)
    
    PS->>DB: Query existing pending RepairCost<br/>where transactable_id = {rental_id}
    alt finds pending estimate
        PS->>DB: UPDATE transaction (reuse it)<br/>set provider, reference, payer_name
    else no pending estimate
        PS->>DB: INSERT new PaymentTransaction
    end
    
    PS-->>FE: { authorizationUrl }
    
    Note over FE, LIS: When webhook completes payment...
    PS->>LIS: event(PaymentStatusUpdated)
    LIS->>LIS: Check transaction metadata['purpose'] == 'damage'
    
    LIS->>DB: DB::transaction()
    LIS->>DB: Soft delete any duplicate pending RepairCost
    LIS->>DB: UPDATE rental: damage_balance_due = null,<br/>damage_settlement_status = 'settled'
    LIS->>DB: Tag transaction type = 'DamageCharge'
    LIS->>DB: commit()
```