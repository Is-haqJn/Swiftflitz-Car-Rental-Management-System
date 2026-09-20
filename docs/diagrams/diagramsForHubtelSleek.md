# Payment Provider Payment Workflows (Sleek)

These diagrams represent the Payment Provider payment integration using simple, non-technical language. The visual design is customized using the Swiftflitz system colors (Primary Blue: `#126dff`, Secondary Dark: `#00203f`).

---

## 1. Initiating a Payment

When a customer decides to securely pay for their rental online.

```mermaid
%%{init: { 'themeVariables': { 'primaryBorderColor': '#126dff', 'actorBorder': '#126dff', 'signalColor': '#126dff', 'noteBorder': '#126dff' } } }%%
sequenceDiagram
    autonumber
    participant App as Swiftflitz App
    participant Payment Provider as Payment Provider API
    participant Checkout as Payment Provider Checkout

    App->>Payment Provider: Request to create a secure online checkout invoice
    Payment Provider-->>App: Responds with a unique checkout URL and reference token
    App->>Checkout: Redirects the customer to the Payment Provider Checkout page to make payment
```

---

## 2. Successful Payment (Automated Notification)

What happens immediately after the customer enters their PIN and the payment clears on Payment Provider's side.

```mermaid
%%{init: { 'themeVariables': { 'primaryBorderColor': '#126dff', 'actorBorder': '#126dff', 'signalColor': '#126dff', 'noteBorder': '#126dff' } } }%%
sequenceDiagram
    autonumber
    participant Customer as Customer
    participant Checkout as Payment Provider
    participant App as Swiftflitz App
    participant Notify as Notification System

    Checkout->>App: Instantly alerts the system that payment succeeded (Webhook)
    
    Note over Checkout, App: System quickly checks directly with Payment Provider<br/>to verify the alert is genuinely from them
    
    alt Payment Provider verification succeeds
        App->>App: Marks the customer's invoice as "Paid" internally
        App->>Notify: Send payment received notification and receipts
        Notify-->>Customer: Swiftflitz sends out automated SMS & Email receipts
        Checkout-->>Customer: Safely redirects customer back to the Swiftflitz success screen
    else Payment Provider verification unavailable (server not yet whitelisted)
        App->>App: Flags invoice as "Under Review"
        App->>Notify: Alerts the admin team for manual verification
        Note over App, Notify: Admin approves or rejects from the admin panel.<br/>Customer is notified once resolved.
    end
```

---

## 3. The 5-Minute Safety Net (Fallback Check)

Sometimes, network issues prevent Payment Provider from instantly notifying our system. The system automatically double-checks missed notifications.

```mermaid
%%{init: { 'themeVariables': { 'primaryBorderColor': '#126dff', 'actorBorder': '#126dff', 'signalColor': '#126dff', 'noteBorder': '#126dff' } } }%%
sequenceDiagram
    autonumber
    participant Timer as 5-Min Auto-Check
    participant App as Swiftflitz App
    participant Payment Provider as Payment Provider API

    Timer->>App: Triggers a background check every 5 minutes
    App->>App: Gathers old payments that are stuck as "Pending"
    
    App->>Payment Provider: Asks the Gateway for the final status of these payments
    Payment Provider-->>App: Returns the final status ("Paid" or "Unpaid")
    
    alt Payment is actually Paid
        App->>App: Fixes our records to "Paid" and sends delayed receipts
    else Still Unpaid
        App->>App: Leaves it as "Pending" (still waiting for the customer)
    end
```

---

## 4. Paying for Damages (Special Case)

When a customer is paying specifically for vehicle damages rather than a normal rental fee.

```mermaid
%%{init: { 'themeVariables': { 'primaryBorderColor': '#126dff', 'actorBorder': '#126dff', 'signalColor': '#126dff', 'noteBorder': '#126dff' } } }%%
sequenceDiagram
    autonumber
    participant Customer as Customer
    participant App as Swiftflitz App
    participant DB as Secure Database

    Customer->>App: Starts the payment process specifically for "Damages"
    App->>DB: Checks if an estimated repair cost was already saved
    
    alt Found an existing estimate
        App->>DB: Temporarily reuses the exact estimate record for this payment attempt
    else No estimate previously saved
        App->>DB: Creates a brand new separate damage charge record
    end
    
    App->>Customer: Redirects customer to the normal Checkout portal
    
    Note over Customer, DB: Once payment is successful, any duplicated<br/>estimates are permanently cleaned up!
```
