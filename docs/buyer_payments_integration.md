# Buyer Payments Page Integration Guide

This document outlines the steps required to fully integrate the Buyer Payments page (`app/user/[userId]/buyer/payments/page.tsx`) into the application.

## 1. API Endpoint for Fetching Payments

**Goal:** Replace the mock `fetchBuyerPayments` function with a real API call.

**Steps:**

*   **Create API Route:** Create a new API route file at `app/api/payments/buyer/route.ts` (or similar, depending on your API structure).
*   **Implement GET Handler:** Implement a GET handler within this file.
    *   **Authentication:** Ensure the handler verifies the user's authentication status and that the requesting user is a buyer.
    *   **Query Parameters:** Accept query parameters like `userId` (from the authenticated user) and `gigType` (for filtering).
*   **Database Query:** Query your PostgreSQL database (or other data source) to retrieve the payment history for the specified buyer, applying the `gigType` filter if provided.
*   **Response:** Return the payment data as a JSON response.
*   **Update Component:** In `app/user/[userId]/buyer/payments/page.tsx`, replace the `fetchBuyerPayments` mock function with a call to this new API endpoint using `fetch`.

## 2. Invoice Generation API

**Goal:** Implement the functionality for the "Generate Invoice" button.

**Steps:**

*   **Create API Route:** Create a new API route file at `app/api/payments/[paymentId]/invoice/route.ts`.
*   **Implement GET Handler:** Implement a GET handler within this file.
    *   **Authentication:** Ensure the handler verifies the user's authentication status and that the requesting user is the buyer associated with the payment.
    *   **Payment ID:** Extract the `paymentId` from the route parameters.
*   **Generate Invoice:** Use a library (e.g., `pdfkit`, `react-pdf`) to generate a PDF invoice based on the payment details.
*   **Response:** Return the generated PDF file or a URL to the generated file.
*   **Update Component:** In `app/user/[userId]/buyer/payments/page.tsx`, update the `handleGenerateInvoice` function to call this new API endpoint and handle the response (e.g., open the PDF in a new tab).

## 3. Repeat Gig Logic

**Goal:** Implement the functionality for the "Repeat Gig" button.

**Steps:**

*   **Create Booking Page:** Create a new page for booking a gig (e.g., `app/user/[userId]/buyer/hire/page.tsx`).
*   **Accept Query Parameters:** Design the booking page to accept query parameters like `repeatGigId` and `workerId`.
*   **Pre-fill Data:** Use the `repeatGigId` to fetch the details of the previous gig and pre-fill the booking form.
*   **Update Component:** In `app/user/[userId]/buyer/payments/page.tsx`, update the `handleRepeatGig` function to navigate to the booking page with the appropriate query parameters.

## 4. Pay Now Logic

**Goal:** Implement the functionality for the "Pay Now" button for pending payments.

**Steps:**

*   **Integrate Stripe:** Ensure Stripe is integrated into your application.
*   **Create API Route:** Create a new API route file at `app/api/payments/[paymentId]/checkout/route.ts`.
*   **Implement POST Handler:** Implement a POST handler within this file.
    *   **Authentication:** Ensure the handler verifies the user's authentication status and that the requesting user is the buyer associated with the payment.
    *   **Payment ID:** Extract the `paymentId` from the route parameters.
*   **Create Stripe Checkout Session:** Use the Stripe API to create a checkout session for the pending payment.
*   **Response:** Return the checkout session URL.
*   **Update Component:** In `app/user/[userId]/buyer/payments/page.tsx`, update the "Pay Now" button's `onClick` handler to call this new API endpoint and redirect the user to the Stripe checkout page.

## 5. Chart Visualization

**Goal:** Replace the placeholder chart with a real visualization using Recharts.

**Steps:**

*   **Install Recharts:**
    ```bash
    npm install recharts
    ```

*   **Import Components:**
    ```typescript
    import { 
      BarChart, 
      Bar, 
      XAxis, 
      YAxis, 
      CartesianGrid, 
      Tooltip, 
      ResponsiveContainer 
    } from 'recharts';
    ```

*   **Create Custom Tooltip Component:**
    ```typescript
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className={styles.chartTooltip}>
            <p className={styles.tooltipLabel}>{label}</p>
            <p className={styles.tooltipValue}>£{payload[0].value.toFixed(2)}</p>
          </div>
        );
      }
      return null;
    };
    ```

*   **Add Chart Styles:**
    ```css
    /* Chart Tooltip Styles */
    .chartTooltip {
      background-color: #1f1f1f;
      border: 1px solid #3a3a3a;
      border-radius: 0.5rem;
      padding: 0.75rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .tooltipLabel {
      color: #a0a0a0;
      font-size: 0.875rem;
      margin: 0 0 0.25rem 0;
    }

    .tooltipValue {
      color: var(--primary-color);
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
    }
    ```

*   **Implement Chart Component:**
    ```typescript
    <ResponsiveContainer width="100%" height="100%">
      <BarChart 
        data={chartData} 
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="#3a3a3a" 
          vertical={false}
        />
        <XAxis 
          dataKey="name" 
          tick={{ fill: '#a0a0a0', fontSize: 12 }}
          axisLine={{ stroke: '#3a3a3a' }}
          tickLine={{ stroke: '#3a3a3a' }}
        />
        <YAxis 
          tickFormatter={(value) => `£${value}`}
          tick={{ fill: '#a0a0a0', fontSize: 12 }}
          axisLine={{ stroke: '#3a3a3a' }}
          tickLine={{ stroke: '#3a3a3a' }}
        />
        <Tooltip 
          content={<CustomTooltip />}
          cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
        />
        <Bar 
          dataKey="total" 
          fill="var(--primary-color)" 
          radius={[4, 4, 0, 0]}
          maxBarSize={50}
        />
      </BarChart>
    </ResponsiveContainer>
    ```

*   **Chart Features:**
    * Responsive container that adapts to parent size
    * Custom tooltip with formatted currency values
    * Dark theme styling matching the application
    * Hover effects on bars
    * Currency formatting on Y-axis
    * Removed vertical grid lines for cleaner look
    * Limited bar width for better aesthetics
    * Loading and empty states

*   **Data Structure:**
    ```typescript
    interface ChartDataPoint {
      name: string;    // Month-Year (e.g., "Dec 23")
      total: number;   // Total amount for that month
    }
    ```

*   **Data Processing:**
    ```typescript
    const getChartData = (payments: Payment[]) => {
      const monthlyTotals: { [key: string]: number } = {};
      payments.forEach(p => {
        if (p.status === 'Paid') {
          const month = new Date(p.date).toLocaleString('default', { 
            month: 'short', 
            year: '2-digit' 
          });
          monthlyTotals[month] = (monthlyTotals[month] || 0) + p.amount;
        }
      });
      return Object.entries(monthlyTotals)
        .map(([name, total]) => ({ name, total }))
        .reverse(); // Newest first
    };
    ```

*   **Update Component:** In `app/user/[userId]/buyer/payments/page.tsx`, replace the placeholder chart `div` with the actual chart component, using the `chartData` generated by the `getChartData` function.

## 6. Filter Modal (Optional)

**Goal:** Refine the filter modal implementation for a better user experience.

**Steps:**

*   **Consider Radix UI Dialog:** Use a library like Radix UI Dialog for a more robust and accessible modal implementation.
*   **Install Radix UI Dialog:** Install the Radix UI Dialog package (`npm install @radix-ui/react-dialog`).
*   **Import Components:** Import the necessary components from Radix UI Dialog.
*   **Update Component:** In `app/user/[userId]/buyer/payments/page.tsx`, replace the basic modal implementation with the Radix UI Dialog component.

## Conclusion

By following these steps, you can fully integrate the Buyer Payments page into your application, providing a complete and functional experience for buyers to view their payment history, generate invoices, repeat gigs, and pay for pending payments. 