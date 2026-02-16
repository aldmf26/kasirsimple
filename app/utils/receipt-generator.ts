import { formatCurrency, formatDateTime } from "./helpers";

export const generateTextReceipt = (transaction: any, store: any, settings: any) => {
    const paperWidth = settings.paperWidth || settings.paper_width || 58;
    const cols = paperWidth === 80 ? 48 : 32;

    let text = "";

    // Center Align
    const center = (str: string) => {
        const padding = Math.max(0, Math.floor((cols - str.length) / 2));
        return " ".repeat(padding) + str + "\n";
    };

    // Fill Line
    const line = () => "-".repeat(cols) + "\n";

    // Justify
    const justify = (left: string, right: string) => {
        const space = Math.max(1, cols - left.length - right.length);
        return left + " ".repeat(space) + right + "\n";
    };

    text += center(store.name || "KASIR SIMPLE");
    if (settings.includeStoreInfo !== false && settings.include_store_info !== false) {
        if (store.address) text += center(store.address);
        if (store.phone) text += center(store.phone);
    }

    text += "\n";
    text += justify("No: " + (transaction.transaction_number || transaction.id), "");
    text += justify(formatDateTime(transaction.created_at), "");
    text += line();

    transaction.items.forEach((item: any) => {
        text += `${item.quantity}x ${item.product_name}\n`;
        text += justify(`   @${formatCurrency(item.product_price)}`, formatCurrency(item.subtotal || item.product_price * item.quantity));
    });

    text += line();
    text += justify("SUBTOTAL", formatCurrency(transaction.subtotal));

    if (transaction.discount > 0) {
        text += justify("DISKON MANUAL", "-" + formatCurrency(transaction.discount));
    }
    if (transaction.discount_from_settings > 0) {
        text += justify("DISKON SISTEM", "-" + formatCurrency(transaction.discount_from_settings));
    }
    if (transaction.tax > 0) {
        text += justify(`PAJAK (${transaction.tax_percentage}%)`, "+" + formatCurrency(transaction.tax));
    }
    if (transaction.ppn > 0) {
        text += justify(`PPN (${transaction.ppn_percentage}%)`, "+" + formatCurrency(transaction.ppn));
    }

    text += line();
    text += justify("TOTAL", formatCurrency(transaction.total));
    text += justify(`BAYAR (${transaction.payment_method?.toUpperCase() || 'CASH'})`, formatCurrency(transaction.paid_amount || transaction.total));
    text += justify("KEMBALI", formatCurrency((transaction.paid_amount || transaction.total) - transaction.total));

    text += "\n";
    if (settings.footerText || settings.footer_text) {
        text += center(settings.footerText || settings.footer_text);
    } else {
        text += center("Terima Kasih");
        text += center("Silahkan Datang Kembali");
    }

    text += "\n\n\n\n";

    return text;
};
