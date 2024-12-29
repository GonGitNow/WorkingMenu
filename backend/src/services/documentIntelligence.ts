import { AzureKeyCredential, DocumentAnalysisClient, DocumentField } from "@azure/ai-form-recognizer";

interface ParsedItem {
    description: string;
    productCode: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    amount: number;
}

interface ParsedInvoice {
    invoiceNumber: string;
    date: string;
    vendor: {
        name: string;
        address: string;
    };
    purchaseOrder: string;
    items: ParsedItem[];
    subTotal: number;
}

export function parseInvoiceData(apiResponse: any): ParsedInvoice {
    if (!apiResponse.documents?.[0]) {
        throw new Error('No document data found in response');
    }

    const doc = apiResponse.documents[0];
    const fields = doc.fields;

    const itemsField = fields.Items;
    const itemsArray = Array.isArray(itemsField?.content) ? itemsField.content : [];
    const parsedItems = itemsArray.map((item: any) => ({
        description: item.Description?.content || '',
        productCode: item.ProductCode?.content || '',
        quantity: Number(item.Quantity?.content) || 0,
        unit: item.Unit?.content || '',
        unitPrice: Number(item.UnitPrice?.content?.match(/\d+\.?\d*/)?.[0]) || 0,
        amount: Number(item.Amount?.content?.match(/\d+\.?\d*/)?.[0]) || 0
    }));

    const vendorAddressField = fields.VendorAddress;
    const addressContent = typeof vendorAddressField?.content === 'object' ? 
        (vendorAddressField.content as { streetAddress?: string })?.streetAddress : '';

    return {
        invoiceNumber: fields.InvoiceId?.content || '',
        date: fields.InvoiceDate?.content || '',
        vendor: {
            name: fields.VendorName?.content || '',
            address: addressContent || ''
        },
        purchaseOrder: fields.PurchaseOrder?.content || '',
        items: parsedItems,
        subTotal: Number(fields.SubTotal?.content?.match(/\d+\.?\d*/)?.[0]) || 0
    };
} 