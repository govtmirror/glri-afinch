Ext.ns('AFINCH.ui');

AFINCH.ui.errorNotify = function(message){
    if(undefined === message){
        message = "An Error occurred. See browser logs for details.";
    }
    new Ext.ux.Notify({
        msgWidth: 200,
        title: 'Error',
        msg: message
    }).show(document);
};