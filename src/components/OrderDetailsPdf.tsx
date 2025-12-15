/**
 * A component for generating Order Details as a PDF document.
 *
 * @author psarando
 */
import {
    Document,
    Image as PdfImage,
    Page,
    StyleSheet,
    Text,
    View,
} from "@react-pdf/renderer";

import {
    LineItemIDEnum,
    OrderDetails,
    TransactionResponseCodeEnum,
} from "@/app/api/types";
import CyVersePalette from "@/components/theme/CyVersePalette";
import { formatDate } from "@/utils/formatUtils";

// Create styles
const pdfStyles = StyleSheet.create({
    logo: { width: 200, height: 40 },
    orpLogo: { width: 145, height: 41 },
    page: {
        padding: 10,
        fontSize: 16,
    },
    grid: {
        flexDirection: "row",
    },
    section: {
        margin: 10,
        flexGrow: 1,
    },
    textSuccess: { color: CyVersePalette.grass },
    textError: { color: CyVersePalette.alertRed },
});

// Create Document Component
const OrderDetailsPdf = ({
    imagesBaseURL,
    order,
}: {
    imagesBaseURL: string;
    order: OrderDetails;
}) => {
    const { poNumber, orderDate, amount, transactionResponses, lineItems } =
        order;
    const transactionResponse = transactionResponses && transactionResponses[0];
    const errorMsgs = transactionResponse?.errors || [];

    return (
        <Document>
            <Page size="A4" style={pdfStyles.page}>
                <View style={pdfStyles.grid}>
                    <PdfImage
                        src={`${imagesBaseURL}/UA_Research-and-Partnerships.png`}
                        style={pdfStyles.orpLogo}
                    />
                    <View style={{ flexGrow: 1, alignItems: "center" }}>
                        <PdfImage
                            src={`${imagesBaseURL}/cyverse_logo_2.png`}
                            style={pdfStyles.logo}
                        />
                    </View>
                    <View style={{ fontSize: 10 }}>
                        <Text>Bio5 Institute</Text>
                        <Text>BSRL 200A</Text>
                        <Text>P.O. Box 210077</Text>
                        <Text>(520) 621-4064</Text>
                        <Text>FAX: (520) 621-1364</Text>
                    </View>
                </View>
                <View style={pdfStyles.grid}>
                    <View style={pdfStyles.section}>
                        <Text>PO Number</Text>
                        <Text>Order Date</Text>
                        <Text>Transaction ID</Text>
                        {lineItems &&
                            lineItems.length > 0 &&
                            lineItems.map((item, index) => (
                                <Text key={item.id}>
                                    {index === 0 ? "Ordered Items" : " "}
                                </Text>
                            ))}
                        <Text>Order Total</Text>
                        <Text>Transaction Status</Text>
                        {transactionResponse?.transDate && (
                            <Text>Transaction Date</Text>
                        )}
                        {errorMsgs.length > 0
                            ? errorMsgs.map((error, index) => (
                                  <Text
                                      key={error.errorText}
                                      style={pdfStyles.textError}
                                  >
                                      {index === 0 ? "Errors" : " "}
                                  </Text>
                              ))
                            : transactionResponse?.messages &&
                              transactionResponse.messages.length > 0 &&
                              transactionResponse.messages.map((msg, index) => (
                                  <Text
                                      key={msg.text}
                                      style={
                                          msg.code.startsWith("E")
                                              ? pdfStyles.textError
                                              : pdfStyles.textSuccess
                                      }
                                  >
                                      {index === 0
                                          ? "Transaction Messages"
                                          : " "}
                                  </Text>
                              ))}
                    </View>
                    <View style={pdfStyles.section}>
                        <Text>{poNumber}</Text>
                        <Text>{formatDate(new Date(orderDate))}</Text>
                        <Text>{transactionResponse?.transId ?? " "}</Text>
                        {lineItems &&
                            lineItems.length > 0 &&
                            lineItems.map((item) => (
                                <Text key={item.id}>
                                    {`${item.quantity} ${
                                        item.itemId ===
                                        LineItemIDEnum.SUBSCRIPTION
                                            ? item.quantity > 1
                                                ? "Years"
                                                : "Year"
                                            : "x"
                                    } ${item.name} ${item.itemId} @ ${item.unitPrice} each.`}
                                </Text>
                            ))}
                        <Text>{amount}</Text>
                        {transactionResponse?.responseCode ===
                        TransactionResponseCodeEnum.APPROVED ? (
                            <Text style={pdfStyles.textSuccess}>Approved</Text>
                        ) : transactionResponse?.responseCode ===
                          TransactionResponseCodeEnum.DECLINED ? (
                            <Text style={pdfStyles.textError}>Declined</Text>
                        ) : transactionResponse?.responseCode ===
                          TransactionResponseCodeEnum.ERROR ? (
                            <Text style={pdfStyles.textError}>Error</Text>
                        ) : transactionResponse?.responseCode ===
                          TransactionResponseCodeEnum.HELD_FOR_REVIEW ? (
                            <Text style={pdfStyles.textError}>
                                Held For Review
                            </Text>
                        ) : (
                            <Text style={pdfStyles.textError}>
                                The transaction was not processed.
                            </Text>
                        )}
                        {transactionResponse?.transDate && (
                            <Text>
                                {formatDate(
                                    new Date(transactionResponse.transDate),
                                )}
                            </Text>
                        )}
                        {errorMsgs.length > 0
                            ? errorMsgs.map((error) => (
                                  <Text
                                      key={error.errorText}
                                      style={pdfStyles.textError}
                                  >
                                      {error.errorText}
                                  </Text>
                              ))
                            : transactionResponse?.messages &&
                              transactionResponse.messages.length > 0 &&
                              transactionResponse.messages.map((msg) => (
                                  <Text
                                      key={msg.text}
                                      style={
                                          msg.code.startsWith("E")
                                              ? pdfStyles.textError
                                              : pdfStyles.textSuccess
                                      }
                                  >
                                      {msg.text}
                                  </Text>
                              ))}
                    </View>
                </View>
            </Page>
        </Document>
    );
};

export default OrderDetailsPdf;
