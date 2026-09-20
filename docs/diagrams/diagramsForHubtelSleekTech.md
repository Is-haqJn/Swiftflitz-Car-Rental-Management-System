# Hubtel Payment Workflows (Sleek Technical)

These diagrams outline the technical flow of the Hubtel payment integration. The visual design is customized using the Swiftflitz system fonts and colors (Primary Blue: `#126dff`, Secondary Dark: `#00203f`).

---

## 1. Payment Initiation (Hubtel Checkout)

```mermaid
%%{init: { 'themeVariables': { 'primaryBorderColor': '#126dff', 'actorBorder': '#126dff', 'signalColor': '#126dff', 'noteBorder': '#126dff' } } }%%
sequenceDiagram
    autonumber
    participant FE as Frontend (React)
    participant API as Backend API
    participant PS as PaymentService
    participant HA as HubtelAdapter
    participant DB as DB (Transactions)
    participant HUB as Hubtel Endpoint

    FE->>API: POST /api/v1/payments/initiate<br/>{ purpose, amount, ... }
    API->>PS: initiate(PaymentInitiateData)
    PS->>PS: resolvePayableAmount()
    PS->>HA: initiate(secureData)
    
    HA->>HUB: POST /items/initiate
    HUB-->>HA: { checkoutUrl, clientReference }
    
    HA-->>PS: PaymentResult
    PS->>DB: INSERT status=pending
    PS-->>API: PaymentResult
    API-->>FE: { authorization_url }
```

---

## 2. Successful Payment (Webhook Callback & Priority Polling)

```mermaid
%%{init: { 'themeVariables': { 'primaryBorderColor': '#126dff', 'actorBorder': '#126dff', 'signalColor': '#126dff', 'noteBorder': '#126dff' } } }%%
sequenceDiagram
    autonumber
    participant FE as Frontend Polling
    participant HUB as Hubtel Webhook
    participant API as Backend API
    participant PS as PaymentService
    participant HA as HubtelAdapter
    participant DB as Database
    participant EV as Event Listener

    HUB->>API: POST /api/v1/payments/webhook/hubtel
    API->>PS: handleWebhook("hubtel", request)
    PS->>HA: verify(reference)
    alt verify() succeeds
        HA-->>PS: PaymentVerifyResult from Hubtel API
        PS->>DB: UPDATE status=paid, paid_at=now()
        PS->>API: Broadcasts event(PaymentStatusUpdated)
        API->>EV: Catches PaymentStatusUpdated
        EV->>API: Dispatches Notification Jobs (SMS, Email)
    else verify() fails or times out (e.g. IP not whitelisted)
        HA--xPS: Exception / Timeout / 403
        PS->>DB: UPDATE status=under_review
        PS->>PS: dispatch SendUnderReviewNotificationJob
        Note over PS: Admin resolves via<br/>POST /api/v1/transactions/{tx}/resolve
    end
    
    loop Every 15 seconds (DB Polling)
        FE->>API: GET /api/v1/payments/status/{reference}
        API->>DB: Check DB internal status
        API-->>FE: { status:"paid" }
    end
```

---

## 3. Mandatory 5-Minute Setup (Fallback CRON)

```mermaid
%%{init: { 'themeVariables': { 'primaryBorderColor': '#126dff', 'actorBorder': '#126dff', 'signalColor': '#126dff', 'noteBorder': '#126dff' } } }%%
sequenceDiagram
    autonumber
    participant SCHED as Laravel Scheduler
    participant JOB as HubtelPaymentsJob
    participant HA as HubtelAdapter
    participant TX as Hubtel Status API
    participant DB as Database

    SCHED->>JOB: dispatch(everyFiveMinutes)
    JOB->>DB: SELECT provider=hubtel AND status=pending
    
    loop For each stale transaction
        JOB->>HA: verify(reference)
        HA->>TX: GET /transactions/{merchantId}/status
        TX-->>HA: { status:"Paid" | "Unpaid" }
        
        alt status = Paid
            HA->>DB: UPDATE status=paid
        else status = Unpaid
            HA->>DB: Continues waiting
        end
    end
```

---

## 4. Online Damage Payment Flow (`purpose=damage`)

```mermaid
%%{init: { 'themeVariables': { 'primaryBorderColor': '#126dff', 'actorBorder': '#126dff', 'signalColor': '#126dff', 'noteBorder': '#126dff' } } }%%
sequenceDiagram
    autonumber
    participant API as Backend API
    participant PS as PaymentService
    participant DB as Database
    participant LIS as Event Listener

    API->>PS: initiate({ purpose:"damage" })
    
    PS->>DB: Query existing pending 'RepairCost'
    alt found pending estimate
        PS->>DB: UPDATE existing row (prevent duplicates)
    else no estimate exists
        PS->>DB: INSERT new manual transaction
    end
    
    Note over PS, LIS: When the webhook confirms payment...
    PS->>LIS: event(PaymentStatusUpdated)
    
    LIS->>DB: Wrap in DB::transaction()
    LIS->>DB: Soft delete any alternate pending RepairCost
    LIS->>DB: UPDATE rental damage_status = 'settled'
    LIS->>DB: Tag transaction type = 'DamageCharge'
```
