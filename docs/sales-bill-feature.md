# Sales Bills Feature Documentation

## Overview

The Sales Bill feature allows users to create, view, and manage sales bills based on completed dispatches. The feature integrates with existing dispatch and order data to streamline the billing process.

## Features

- **Select from Completed Dispatches**: Choose from a list of completed dispatches to create sales bills
- **Auto-populated Data**: Data from selected dispatches is auto-populated to minimize manual entry
- **Editable Fields**: Invoice number, company name, catalog name, quantity, rate, GST percentage, transport charge, etc.
- **PDF Generation**: Generate, view, and download PDF versions of sales bills
- **Status Management**: Track bills with statuses like Draft, Sent, Paid, and Cancelled
- **Payment Status**: Monitor payment status including Pending, Partial, Paid, and Overdue

## Component Structure

1. **DispatchList**: Displays completed dispatches with search and pagination
2. **SalesBillNew**: Creates new sales bills from selected dispatches
3. **SalesBillList**: Views all sales bills with filtering and pagination
4. **SalesBillDetail**: Views and manages individual sales bill details
5. **SalesBillEdit**: Edits existing sales bills

## Database Structure

- **sales_bills table**: Stores bill data including bill number, company details, product details, and financial information
- **Database Triggers**:
  - `set_bill_number()`: Auto-generates bill numbers in format YYYY-MM-XXX
  - `update_sales_bills_updated_at()`: Updates timestamps on bill changes

## Usage Guide

1. Navigate to "Sales Bills" in the sidebar
2. Click "New Sales Bill" button
3. Select a completed dispatch from the list
4. Review and edit the auto-populated data
5. Save the bill as a draft or finalize it
6. Generate and send PDF to clients
7. Update payment status as payments are received

## PDF Generation

The PDF generator creates professional-looking sales bill documents including:

- Company and client details
- Product information
- Pricing breakdown including GST calculations
- Payment terms and notes
- Total amount and payment status

## Error Handling

The feature includes comprehensive validation and error handling:

- Required field validation
- Data type checking
- Numeric value validation (non-negative amounts)
- PDF generation error handling
- Status transition validation

## Integration Points

- Integrates with Dispatch feature to access completed dispatch data
- Connects to Orders system for underlying order details
- Uses company information from the Companies module
