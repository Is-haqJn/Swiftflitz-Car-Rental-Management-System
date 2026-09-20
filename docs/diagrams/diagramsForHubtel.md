# Hubtel Payment Workflows (Simplified)

These diagrams represent the Hubtel payment integration using plain-English concepts to easily understand the logic flows, stripping away overly technical code references.

---

## 1. Initiating a Payment

When a customer decides to securely pay for their rental online.

```mermaid
sequenceDiagram
    participant Customer
    participant Website as Frontend Website
    participant System as Swiftflitz System
    participant Hubtel as Hubtel Gateway

    Customer->>Website: Reviwes booking and clicks "Pay Now"
    Website->>System: Ask for a secure payment link
    System->>System: Calculate final amount due
    System->>Hubtel: Request a new payment session
    Hubtel-->>System: Return secure checkout URL
    System-->>Website: Give URL to the customer's browser
    Website->>Customer: Safely redirect customer to Hubtel
```

---

## 2. Successful Payment (Automated Notification)

What happens immediately after the customer enters their PIN and the payment clears on Hubtel's side.

```mermaid
sequenceDiagram
    participant Customer
    participant Hubtel as Hubtel Gateway
    participant System as Swiftflitz System
    participant Notify as Notification System

    Customer->>Hubtel: Completes Mobile Money or Card payment
    Hubtel->>System: Instantly alert the system that payment succeeded (Webhook)
    
    Note over System: System double-checks with Hubtel<br/>to ensure the alert is genuine.
    
    alt Hubtel verification succeeds
        System->>System: Mark the customer's invoice as "Paid"
        System->>Notify: Send payment received notification and receipts
        Notify-->>Customer: Send automated SMS & Email receipt
        Hubtel->>Customer: Bring customer back to our Website (Success Screen)
    else Hubtel verification unavailable (server not yet whitelisted)
        System->>System: Flag invoice as "Under Review"
        System->>Notify: Alert admin team for manual verification
        Note over System, Notify: Admin approves or rejects from the admin panel.<br/>Customer is notified once resolved.
    end
```

---

## 3. The 5-Minute Safety Net (Fallback Check)

Sometimes, network issues prevent Hubtel from instantly notifying our system. The system automatically double-checks missed notifications.

```mermaid
sequenceDiagram
    participant Timer as 5-Minute Background Job
    participant System as Swiftflitz System
    participant Hubtel as Hubtel Gateway

    Timer->>System: Run every 5 minutes
    System->>System: Find old payments still marked "Pending"
    
    loop For each old pending payment
        System->>Hubtel: "Did this specific customer actually pay?"
        Hubtel-->>System: "Yes, it was paid" or "No, still unpaid"
        
        alt Payment is actually Paid
            System->>System: Update our records to "Paid"
            System->>Customer: Send out delayed SMS & Email receipt
        else Still Unpaid
            System->>System: Leave it as pending (wait for them to pay)
        end
    end
```

---

## 4. Paying for Damages (Special Case)

When a customer is paying specifically for vehicle damages rather than a normal rental fee. We must be careful not to double-charge them or duplicate records.

```mermaid
sequenceDiagram
    participant Customer
    participant System as Swiftflitz System
    participant DB as Database

    Customer->>System: Start payment process specifically for "Damages"
    System->>DB: Check if we already have a "Pending Repair Estimate" saved
    
    alt Found an existing estimate
        System->>DB: Temporarily reuse the estimate record for this payment
    else No estimate previously saved
        System->>DB: Create a brand new damage charge record
    end
    
    System->>Customer: Redirect customer to Hubtel checkout...
    
    Note over System, DB: Once Hubtel confirms the payment is successful,<br/>the system cleans up any duplicate estimates<br/>and officially settles the damage fee.
```
