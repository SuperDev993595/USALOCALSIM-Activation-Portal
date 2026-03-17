USALOCALSIM: Voucher & Activation Rules
1. The Voucher Cycle (The Golden Rules)
The system must prevent any voucher from being used until it has been officially "unlocked" by a dealer or admin.
•	STEP 1: Inactive (Stock) – The voucher starts "dead." If a customer tries to use it, the site says: "Voucher not yet activated. Please contact your dealer."
•	STEP 2: Activated (Sold) – The dealer sells the voucher and clicks "Unlock" in their panel. The voucher is now "live" and ready for the customer to use.
•	STEP 3: Redeemed (Used) – The customer uses the code. The system "kills" the code so it cannot be used again and logs who used it (Email or ICCID).
2. Dealer Panel (Fast & Simple)
Dealers are on the street and need a fast mobile interface:
•	Bulk Activation: If a partner buys 100 vouchers, the Admin must be able to activate the whole batch at once.
•	Single Unlock: The dealer types the specific voucher code they just sold and clicks "Unlock" to make it valid for the customer.
•	Tracking: The system must show which dealer sold which voucher.
3. Redemption Portal (What the Customer Sees)
The customer goes directly to the URL printed on the card (e.g., activate.usalocalsim.com).
•	Clean Interface: No ads or heavy content. Instant loading on 3G/4G.
•	Smart Recognition: The customer enters the code, and the site automatically knows:
o	If it’s an eSIM: It asks for an Email and sends the QR Code immediately.
o	If it’s a Physical SIM: It asks for the SIM number (ICCID) and adds the Data-Pack.
4. Automation (Service Delivery)
•	eSIM: The system fetches the QR Code and triggers the email in less than 1 minute.
•	Top-up: The system notifies the carrier to activate the plan on the physical SIM instantly.
•	Feedback: The customer sees a "Success! Your service is now active" screen.
5. Essential Security
•	Hacker Protection: If someone enters a wrong code 3 times, the site blocks them for 1 hour.
•	Logs: Every action must be recorded (who activated it, what time, and which device).
++++++++++++++++++++++++++++++++++++++++++++++++++++
Requirement: Dynamic & Verified Email Confirmation
"Requirement: Plan-Specific Email Templates & Synchronization"
"The email confirmation system must be strictly synchronized with the plan associated with the voucher.
1.	Data Consistency: The plan name, data allowance, and duration mentioned in the confirmation email must 100% match the plan advertised on the website and the specific voucher used.
2.	Dynamic Templates: Do not use a generic email. The system must trigger a specific template based on the plan type:
o	Example: A 'Premium Plan' voucher must trigger an email detailing 'Premium' benefits (e.g., Unlimited Data, 30 days).
3.	Final Verification: Before sending the email, the system must perform a final check: Voucher Code -> Associated Plan -> Website Package Description -> Sent Email.
Goal: To ensure the customer receives exactly what they purchased, with no discrepancies between the marketing (site) and the fulfillment (email)."

