sap.ui.define([
], function () {
    "use strict";

    return {
        /* =========================================================== */
        /* formatter methods                                           */
        /* =========================================================== */
        formatDate: function (date) { },
        removeLeadingZeros: function (sValue) {
            if (sValue)
                return parseInt(sValue, 10);
        },
        formatTime: function (time) {
            var parts = time.match(/.{1,2}/g);
            return parts[0] + ":" + parts[1] + ":" + parts[2];
        },
        formatURL: function (sUrl) {
            return "<iframe style=\"border:none; overflow: hidden; height: 100%; width: 95%; position: absolute;\" height=\"100%\" width=\"100%\" src=" +
                sUrl + "></iframe>";
        },
        isDetailVisible: function (sSpkzl) {
            var oSpkzl, iCalcRate;
            if (this.getModel('configModel') && sSpkzl) {
                oSpkzl = this.getModel('configModel').getProperty('/ExpenseType')[sSpkzl];
                iCalcRate = parseInt(oSpkzl.CalcRate);
                return (iCalcRate > 0 || oSpkzl.Title.trim().length > 0);
            }
            // if (iCalcRate > 0 || oSpkzl.Title.trim().length > 0)
            //   return true;
            // return false;
        },
        buttonType: function (sSpkzl) {
            var oSpkzl, iCalcRate;
            if (this.getModel('configModel') && sSpkzl) {
                oSpkzl = this.getModel('configModel').getProperty('/ExpenseType')[sSpkzl];
                iCalcRate = parseInt(oSpkzl.CalcRate);
                if (iCalcRate > 0 || oSpkzl.Title.trim().length > 0)
                    return "Emphasized";
            }
        },
        getErrorString: function (sEtype) {
            var sError;
            switch (sEtype) {
                case 'E':
                    sError = 'Error';
                    break;
                case 'W':
                    sError = 'Warning';
                    break;
                case 'S':
                    sError = 'Success';
                    break;
                case 'I':
                    sError = 'Information';
                    break;
                default:
                    sError = 'Information';
                    break;
            }
            return sError;
        },
    };
});