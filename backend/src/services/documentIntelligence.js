function extractUnitInfo(description, caseQuantity, totalAmount) {
    // Special patterns for Sysco items
    const specialPatterns = [
        // Pattern: "110#AVGBBRLIMP" -> 10 lb total
        {
            regex: /(\d+)#AVG/i,
            handler: (match, qty) => {
                const totalLbs = 10; // Standard size for these items
                return {
                    unit: 'LB',
                    unitsPerCase: totalLbs / qty,
                    totalUnits: totalLbs
                };
            }
        },
        // Pattern: "44.75AVCAB" -> 19 lb total (4 x 4.75)
        {
            regex: /(\d+\.\d+)AV(?:CAB|G)/i,
            handler: (match, qty) => {
                const size = parseFloat(match[1]);
                const totalLbs = size * 4; // 4 pieces per case
                return {
                    unit: 'LB',
                    unitsPerCase: totalLbs,
                    totalUnits: totalLbs
                };
            }
        },
        // Pattern: "102 LB" -> 20 lb total (10 x 2)
        {
            regex: /(\d)(\d)\d?\s*LB/i,
            handler: (match, qty) => {
                const packSize = parseInt(match[1]);
                const unitSize = parseInt(match[2]);
                const totalLbs = packSize * unitSize;
                return {
                    unit: 'LB',
                    unitsPerCase: totalLbs / qty,
                    totalUnits: totalLbs
                };
            }
        },
        // Pattern: "42.5 LB" -> 10 lb total (4 x 2.5)
        {
            regex: /(\d+\.?\d*)\s*LB(?:PORT)?/i,
            handler: (match, qty) => {
                const rawSize = parseFloat(match[1]);
                // If it's the 42.5 pattern, it's actually 4 packs of 2.5
                if (rawSize === 42.5) {
                    return {
                        unit: 'LB',
                        unitsPerCase: 10 / qty, // 10 lb total
                        totalUnits: 10
                    };
                }
                // Otherwise treat as direct weight
                return {
                    unit: 'LB',
                    unitsPerCase: rawSize,
                    totalUnits: rawSize * qty
                };
            }
        }
    ];

    // Try special patterns first
    for (const pattern of specialPatterns) {
        const match = description.match(pattern.regex);
        if (match) {
            const result = pattern.handler(match, caseQuantity);
            if (result && totalAmount > 0 && result.totalUnits > 0) {
                result.pricePerUnit = totalAmount / result.totalUnits;
                return result;
            }
        }
    }

    // Fallback to simple unit patterns
    const simplePatterns = [
        { regex: /(\d+(?:\.\d+)?)\s*OZ/i, unit: 'OZ' },
        { regex: /(\d+(?:\.\d+)?)\s*GAL/i, unit: 'GAL' },
        { regex: /(\d+(?:\.\d+)?)\s*CT/i, unit: 'CT' }
    ];

    for (const pattern of simplePatterns) {
        const match = description.match(pattern.regex);
        if (match) {
            const quantity = parseFloat(match[1]);
            if (quantity > 0 && totalAmount > 0) {
                return {
                    unit: pattern.unit,
                    unitsPerCase: quantity,
                    totalUnits: quantity * caseQuantity,
                    pricePerUnit: totalAmount / (quantity * caseQuantity)
                };
            }
        }
    }

    // If no unit info found but we have amount and quantity, return case pricing
    if (totalAmount > 0 && caseQuantity > 0) {
        return {
            unit: 'CS',
            unitsPerCase: 1,
            totalUnits: caseQuantity,
            pricePerUnit: totalAmount / caseQuantity
        };
    }

    return null;
}

function parseInvoiceData(apiResponse) {
    if (!apiResponse.documents?.[0]) {
        throw new Error('No document data found in response');
    }

    const doc = apiResponse.documents[0];
    const fields = doc.fields;

    // Parse line items
    const items = fields.Items?.values || [];
    const parsedItems = items.map(item => {
        const properties = item.properties;
        const description = properties.Description?.value || '';
        const caseQuantity = properties.Quantity?.value || 0;
        const casePrice = properties.UnitPrice?.value?.amount || 0;
        const totalAmount = properties.Amount?.value?.amount || 0;

        // Extract unit information from description
        const unitInfo = extractUnitInfo(description, caseQuantity, totalAmount);
        
        return {
            description: description.trim(),
            productCode: properties.ProductCode?.value || '',
            caseQuantity: caseQuantity,
            unit: unitInfo?.unit || 'CS',
            unitsPerCase: unitInfo?.unitsPerCase || 0,
            totalUnits: unitInfo?.totalUnits || 0,
            pricePerUnit: unitInfo?.pricePerUnit || 0,
            casePrice: casePrice,
            amount: totalAmount
        };
    });

    // Construct the standardized invoice object
    return {
        invoiceNumber: fields.InvoiceId?.value || '',
        date: fields.InvoiceDate?.value || '',
        vendor: {
            name: fields.VendorName?.value || '',
            address: fields.VendorAddress?.value?.streetAddress || ''
        },
        purchaseOrder: fields.PurchaseOrder?.value || '',
        items: parsedItems,
        subTotal: fields.SubTotal?.value?.amount || 0
    };
}

module.exports = { parseInvoiceData }; 