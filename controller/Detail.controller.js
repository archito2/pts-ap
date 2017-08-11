sap.ui.define([
  "com/dolphin/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "com/dolphin/util/Formatter",
  "sap/m/MessageToast"
], function (BaseController, JSONModel, Formatter, MessageToast) {
  "use strict";
  return BaseController.extend(
    "com.dolphin.controller.Detail", {
      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */
      /**
       * Called when the App view controller is instantiated.
       * @public
       */
      onInit: function () {
        this.setModel(new JSONModel(
          {
            'Tracks': {'DocumentHeaderText':'er1','CompanyCode':'1000','ReceiptDate':'/Date(1502337600000)/','DocDate':'/Date(1502337600000)/'}, 'SubLines': [], 'Items': [],
            'Approvers': [], 'Contacts': [], 'Notes':[]
          }), 'viewModel');
        this.setModel(new JSONModel(), 'configModel');
        this.getRouter().getRoute("apDetail").attachPatternMatched(this._onPatternMatched, this);
        this.getRouter().getRoute("createER").attachPatternMatched(this._onPatternCreateERMatched, this);
      },
      /* =========================================================== */
      /* formatter methods                                           */
      /* =========================================================== */
      formatDate: function (date) {
      },
      formatURL: function (sUrl) {
        return "<iframe style=\"border:none; overflow: hidden; height: 100%; width: 95%; position: absolute;\" height=\"100%\" width=\"100%\" src=" +
          sUrl + "></iframe>";
      },
      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */
      handleSave: function (oEvent) {
        this._saveExpenseReport(oEvent);
      },
      /* =========================================================== */
      /* Internal Methods                                            */
      /* =========================================================== */
      _onPatternMatched: function (oEvent) {
        this.getModel('configModel').setProperty('/WebConfig', sap.ui.getCore().getModel('configModel'));
        this.getModel('viewModel').setProperty('/UIModel', { 'CreateMode': false });
        var sRecNo = oEvent.getParameter("arguments").RecNo;
        this._callTracksService(sRecNo);
        this._callInvoiceItemsService(sRecNo);
      },
      _onPatternCreateERMatched: function (oEvent) {
        this.getModel('configModel').setProperty('/WebConfig', sap.ui.getCore().getModel('configModel'));
        this.getModel('viewModel').setProperty('/UIModel', { 'CreateMode': true });
      },
      // Calls the Tracks Service
      _callTracksService: function (sRecNo) {
        this.getOwnerComponent().getModel('apModel')
          .read("/Tracks('" + sRecNo + "')", {
            success: function (oData, oResponse) {
              this.getModel('viewModel').setProperty('/Tracks', oData);
            }.bind(this),
            error: function (oData, oResponse) {
              console.log(oResponse);
            }
          });
      },
      // Calls the Invoice Items Service
      _callInvoiceItemsService: function (sRecNo) {
        this.getOwnerComponent().getModel('apModel')
          .read("/Tracks('" + sRecNo + "')/InvoiceItems", {
            success: function (oData, oResponse) {
              this.getModel('viewModel').setProperty('/InvoiceItems', oData);
            }.bind(this),
            error: function (oData, oResponse) {
              console.log(oResponse);
            }
          });
      },
      //Save Expense Report
      _saveExpenseReport: function () {
        var oTracks = this.getModel('viewModel').getProperty('/Tracks'),
          oErModel = this.getModel('erModel'),
          that = this;
          oTracks.SubLines = this.getModel('viewModel').getProperty('/SubLines');
          oTracks.ItemER = this.getModel('viewModel').getProperty('/Items');
          oTracks.ApproversER = this.getModel('viewModel').getProperty('/Approvers');
          oTracks.ContactsER = this.getModel('viewModel').getProperty('/Contacts');
          oTracks.ERNotes = this.getModel('viewModel').getProperty('/Notes');
        // oTracks.InvoiceItems = this.getModel('viewModel').getProperty('/Items').results;
        // oTracks.Sublines = this.getModel('viewModel').getProperty('/Sublines');
        sap.ui.core.BusyIndicator.show();
        oErModel.setUseBatch(true);
        oErModel.setHeaders({'PTSUser':'ADAMS'})
        oErModel.create('/HeaderERSet', oTracks, {
          success: function (oData, response) {
            MessageToast.show("Saved Successfully");
            // that._executeApprovalAction("", "A", sRecNo);
          },
          error: function (oError) {       
            sap.ui.core.BusyIndicator.hide();
            that.displayErrorPopup(oError);
          }
        });
      }
    });
});