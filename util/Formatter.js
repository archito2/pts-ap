sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/format/NumberFormat"
], function (Controller,DateFormat,NumberFormat) {
    "use strict";

    return Controller.extend("com.dolphin.controller.Formatter", {
        oFloatNumberFormat: sap.ui.core.format.NumberFormat.getFloatInstance({
            maxFractionDigits: 2,
            minFractionDigits: 2,
            groupingEnabled: true,
            groupingSeparator: ",",
            decimalSeparator: "."
        }), //Returns a NumberFormat instance for float
        oIntegerNumberFormat: sap.ui.core.format.NumberFormat.getIntegerInstance({
            maxFractionDigits: 0,
            groupingEnabled: false
        }), //Returns a NumberFormat instance for integer*/

        formatNumber: function (number) {
            if (number) {
                return dol.ap.util.Formatter.oFloatNumberFormat.format(number);

                if (number == Math.floor(number)) {
                    return dol.ap.util.Formatter.oIntegerNumberFormat.format(number);
                }
                else {
                    return dol.ap.util.Formatter.oFloatNumberFormat.format(number);
                }
            }
        },

        MediumDateFormat: sap.ui.core.format.DateFormat.getDateInstance({
            style: "medium"
        }),

        LongDateFormat: sap.ui.core.format.DateFormat.getDateInstance({
            pattern: "yyyy/MM/dd hh:mm"
        }),

        odataDate2json: function (datestr) {
            if (datestr === null) return null;
            return this.getUTCDate(eval('new ' + datestr.replace(/\//g, '')));
        },

        getUTCDate: function (dateValue) {
            if (dateValue === null) return null;

            var oDate = dateValue instanceof Date ? dateValue : this.MediumDateFormat.parse(dateValue, false); // Don't parse the timezone - we'll do it manually
            return new Date(oDate.getTime() + oDate.getTimezoneOffset() * 60 * 1000);
        },

        parseErrorMessage: function (oError) {
            var oMessage = {};
            var messageText = "";

            try {
                // Try to parse as a JSON string
                oMessage = JSON.parse(oError);
            } catch (err) {
                try {
                    // Whoops - not JSON, check if this is XML
                    switch (typeof oError) {
                        case "string": // XML or simple text
                            if (oError.indexOf("<?xml") == 0) {
                                var oXML = jQuery.parseXML(oError);
                                var oXMLMsg = oXML.querySelector("message");
                                if (oXMLMsg) {
                                    messageText = oXMLMsg.textContent;
                                }
                            } else {
                                // Nope just return the string
                                messageText = oError;
                            }
                            break;

                        case "object": // Exception
                            messageText = oError.toString();
                            break;
                    }
                } catch (err) {
                    messageText = "An unknown error occurred";
                }

                // Return the expected message object
                oMessage = {
                    error: {
                        innererror: null,
                        message: {
                            value: messageText
                        }
                    }
                };
            }
            return oMessage;
        },

        parseResponseMessage: function (oResponseMessage) {
            var oMessage = {};
            var messageText = "";

            try {
                // Try to parse as a JSON string
                oMessage = JSON.parse(oResponseMessage);
            } catch (err) {
                try {
                    // Whoops - not JSON, check if this is XML
                    switch (typeof oResponseMessage) {
                        case "string": // XML or simple text
                            if (oResponseMessage.indexOf("<?xml") == 0) {
                                var oXML = jQuery.parseXML(oResponseMessage);
                                var oXMLMsg = oXML.querySelector("message");
                                if (oXMLMsg) {
                                    messageText = oXMLMsg.textContent;
                                }
                            } else {
                                // Nope just return the string
                                messageText = oResponseMessage;
                            }
                        case "object": // Exception ?
                            messageText = oResponseMessage.toString();
                            break;
                    }
                } catch (err) {
                    messageText = "An unknown error occurred";
                }

                if (messageText) {
                    // Return the expected message object
                    oMessage = {
                        messages: [
                            {
                                text: messageText
                            }
                        ]
                    };
                }
            }
            return oMessage;
        },

        TimeZonePattern: sap.ui.core.format.DateFormat.getDateTimeInstance({
            pattern: "Z"
        }),

        formatRawDate: function (dateValue) {
            return (dateValue != null) ? "/Date(" + dateValue.getTime() + this.TimeZonePattern.format(dateValue) + ")/" : "";
            return (dateValue != null) ? "/Date(" + dateValue.getTime() + ")/" : "";
        },

        logo: function (RecNo) {
            var oModel = sap.ui.getCore().getModel("StatusModel");
            if (oModel) {
                var logo = oModel.getData().map["WEB_LOGO_SRC"];
                if (logo) {
                    return logo;
                }
                else {
                    var rootPath = jQuery.sap.getModulePath("dol.ap");
                    return rootPath + "/img/dolphin_logo.gif";
                }
            }
            else {
                var rootPath = jQuery.sap.getModulePath("dol.ap");
                return rootPath + "/img/dolphin_logo.gif";
            }
        },

        searchHelpVisible: function (RecNo) {
            return true;//help is always visible, if WEB_HELP_LINK_SEARCH is blank or inactive we use default file from doc folder

            var oModel = sap.ui.getCore().getModel("StatusModel");
            if (oModel) {
                var help = oModel.getData().map["WEB_HELP_LINK_SEARCH"];
                if (help) {
                    return true;
                }
                else {
                    return false;
                }
            }
            else {
                return false;
            }
        },

        crHelpVisible: function (RecNo) {
            return true;//help is always visible, if WEB_HELP_LINK_CR is blank or inactive we use default file from doc folder

            var oModel = sap.ui.getCore().getModel("StatusModel");
            if (oModel) {
                var help = oModel.getData().map["WEB_HELP_LINK_CR"];
                if (help) {
                    return true;
                }
                else {
                    return false;
                }
            }
            else {
                return false;
            }
        },

        detailHelpVisible: function (RecNo) {
            return true;//help is always visible, if WEB_HELP_LINK_DETAIL is blank or inactive we use default file from doc folder

            var oModel = sap.ui.getCore().getModel("StatusModel");
            var help = oModel.getData().map["WEB_HELP_LINK_DETAIL"];
            if (help) {
                return true;
            }
            else {
                return false;
            }
        },

        removeLeadingZeroes: function (s, desc) {
            if (s) {
                while (s.substr(0, 1) == '0' && s.length > 1) {
                    s = s.substr(1, 9999);
                }
            }

            if (desc) {
                return s + " " + desc;
            }

            return s;
        },

        myParseFloat: function (stringValue) {
            return parseFloat(stringValue);
        },

        SOURCES: {
            "CR": "Check/Payment request from Employee",
            "ED": "EDI/IDOC",
            "EI": "E-Invoice",
            "EM": "E-Mailed",
            "ER": "Expense Report from Employee",
            "ES": "Evaluated Receipts Settlement",
            "FX": "Faxed",
            "IC": "Inter Company",
            "JE": "Journal Entry",
            "LE": "Legacy",
            "OU": "Outsourced Scan Provider",
            "SC": "Scanned",
            "VP": "Vendor Portal"
        }
    });
});