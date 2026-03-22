Master Specification: USALOCALSIM Activation Portal
1. Core Business Logic: Manual Fulfillment
Non-Automated System: The website does not connect to a real-time activation API. It is a request-capture portal.

The Request Queue: Every submission (Paid or Voucher) is sent to a Manual Admin Dashboard.

Customer Notification: At the end of every transaction, the user must see this message:

"Request Received! Our technical team is now manually activating your USALOCALSIM service. You will receive a confirmation message/email in a few minutes once your line is live."

2. Product & Voucher Modularity
The system treats the Physical USALOCALSIM Card and Vouchers as independent, separate items.

A) The Three Activation Scenarios
SIM Only (Hardware Purchase):

Customer enters a USALOCALSIM ICCID.

System validates the SIM -> Shows Plan Menu -> Applies "Hardware Discount" (deducting the SIM cost already paid).

Customer pays the remaining balance via Stripe (Credit Card ).

The Combo (SIM + Top-up Voucher):

Customer has the SIM and a separate Voucher (bought at a store).

They enter ICCID + Voucher Code.

Checkout total = $0.00.

eSIM Voucher:

Customer enters an eSIM-specific Voucher Code.

Checkout total = $0.00.

3. Technical Constraints
Exclusive Hardware: The system is strictly for USALOCALSIM hardware. The supplier's system will naturally reject any other source.

Two-Field Input: The activation page needs two distinct fields: [ICCID] (required for physical) and [Voucher Code] (optional/conditional).

4. Payment & Globalization
Stripe Integration: Native support for Credit Cards payments.

Intelligent Localization (Geo-IP): The site must automatically detect the user's location and load the dominant language.

Supported Languages: * English (Primary)

French, Japanese, Dutch, Chinese, Spanish, and Hindi.

US Market "Secondary Option":

Target: US Citizens/Residents.

Product: eSIM Only.

Plans: Unlimited Data for 30, 60, or 90 days.

5. Admin Dashboard (Back-Office)
Since you are processing these manually, your developer must provide:

Real-Time Activation Queue: A list of "Pending" activations showing ICCID, Voucher Code, and Email.

Manual Trigger: Once your team activates the line with the supplier, clicking a "Complete" button triggers the automated "Success" email to the customer.

6. User-Facing Instructions (Multilingual)
Headline: "Activate Your USALOCALSIM Service"
Sub-headline: "Our technical team manually processes every request for guaranteed quality. Follow the steps below:"

Option 1: I have a USALOCALSIM Card and a Voucher

Enter your ICCID and Voucher code. Your activation will be processed manually in minutes at no extra cost.

Option 2: I only have a USALOCALSIM Card

Enter your ICCID to choose your data plan and pay via Credit Card . Your initial SIM cost will be discounted.

Option 3: I have an eSIM Voucher

Enter your voucher code to receive your digital QR code via email once processed by our team.

Final Developer Handover Summary:
"Build a portal exclusively for USALOCALSIM hardware. Implement a Manual Activation Queue. The system must handle SIM Cards (ICCIDs) and Vouchers as separate entities. All paths (Voucher or Stripe payment) lead to a 'Processing' status. Localization must support English plus 6 other languages via Geo-IP. The final activation confirmation is sent only after manual admin approval."