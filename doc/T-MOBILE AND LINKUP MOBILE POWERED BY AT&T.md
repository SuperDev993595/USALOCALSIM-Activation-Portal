Hi there,
I am putting together the database architecture and conditional logic for our Global Data Voucher Cart. I need you to implement two distinct product lines along with a set of dynamic UI checkboxes for product-specific add-ons.
Please find the technical specifications, SKUs, and mapping requirements below:
🟥 PRODUCT LINE 1: UNLIMITED PLANS (T-MOBILE)
•	Network Provider: T-Mobile (Please use the official Magenta brand color: #E20074).
•	Base Features (Always Included): Unlimited USA Data, Free USA Number, Unlimited USA SMS, Unlimited USA Local Calls.
•	Supported Formats: Physical SIM & eSIM (Dual delivery option, same pricing).
🏷️ Core Pricing Matrix (T-Mobile)
Please map these products to the database using the following SKUs and pricing:
Product ID / SKU	Duration (Validity)	Price (USD)	Supported Formats
TM-UNL-10D	10 Days	$39.00	Physical SIM / eSIM
TM-UNL-20D	20 Days	$44.00	Physical SIM / eSIM
TM-UNL-30D	30 Days	$49.00	Physical SIM / eSIM
Exportar para as Planilhas
➕ Conditional Add-ons (T-Mobile Exclusive)
Important UX Requirement: These options should only render as checkboxes or toggle switches inside the cart view after a user selects one of the T-Mobile plans above.
•	Add-on A (ADD-TM-MXCA) | Price: +$5.00
o	UI Label: Canada & Mexico Data Coverage
o	UI Description: Adds 5GB of high-speed data roaming inside Canada & Mexico.
•	Add-on B (ADD-TM-INTL) | Price: +$15.00
o	UI Label: North America Stateside International Calling
o	UI Description: Unlimited international landline calls from the USA.
•	Add-on C (ADD-TM-COMBO) | Price: +$20.00
o	UI Label: Full North America Roaming & Calling Combo
o	UI Description: International calling features valid while roaming inside USA, Mexico, or Canada + 5GB Roaming Data.
________________________________________
🟦 PRODUCT LINE 2: LIMITED PLANS (AT&T/LINKUP MOBILE)
•	Network Provider: AT&T/LINKUP MOBILE (Please use the official Blue brand color: #00A3E0).
•	Base Features (Always Included): Fixed Data Allowance, Free USA Number, Local Calls, International Calls & SMS.
•	Validity: Fixed 30 Days for all options.
•	Supported Formats: Physical SIM & eSIM (Dual delivery option, same pricing).
🏷️ Core Pricing Matrix (AT&T/LINKUP MOBILE)
Please map these products to the database using the following SKUs and pricing:
Product ID / SKU	Data Limit	Duration	Price (USD)	Supported Formats
ATT-LIM-12GB	12 GB	30 Days	$30.00	Physical SIM / eSIM
ATT-LIM-30GB	30 GB	30 Days	$35.00	Physical SIM / eSIM
ATT-LIM-50GB	50 GB	30 Days	$45.00	Physical SIM / eSIM
Exportar para as Planilhas
Note for Logic: Please do not display or make the conditional add-ons (ADD-TM-MXCA, ADD-TM-INTL, ADD-TM-COMBO) available if an AT&T/LINKUP MOBILE plan is selected. International and roaming features are already natively baked into the AT&T/LINKUP MOBILE base price structure.
________________________________________
Let me know once this setup is staged in the repository or if you need any clarification on the conditional rendering flow. Thanks!

