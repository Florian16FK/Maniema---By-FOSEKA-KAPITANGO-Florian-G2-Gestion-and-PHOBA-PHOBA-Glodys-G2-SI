
Ext.onReady(function () {
    Ext.QuickTips.init();
	
	var ShowResult = function(result){
		
		/*
		result
				.adr
				.commune
				.cp
				.departement
				.region
				.pays
				.lat
				.lng
		*/
		
		alert(result.toString());
	};
	
	var ShowGMapPopup = function(v){
		var mapPopup = new JSF.Components.JSF_Geo({value : v});
        mapPopup.on('change', ShowResult, this);
		mapPopup.show();
	};
	
    var p = new Ext.Panel({
		autoWidth : true,
		border:false,
        renderTo: Ext.getBody(),
        items: [
			{
				xtype: 'form',
				labelWidth : 300,
				border:false,
				items: [
					{
						xtype: 'button', text : 'Search', fieldLabel : "Simple",
						handler:ShowGMapPopup
					},
					{
						xtype: 'button', text : 'Search', fieldLabel : "Présélect GPS", 
						handler:function(){ShowGMapPopup({lat:'-3.073092900000000000', lng:'26.041388900000015000'})}
					},
					{
						xtype: 'button', text : 'Search', fieldLabel : "Présélect commune", 
						handler:function(){ShowGMapPopup({commune:'Kindu'})}
					},
					{
						xtype: 'button', text : 'Search', fieldLabel : "Présélect Département", 
						handler:function(){ShowGMapPopup({departement:'Maniema'})}
					},
					{
						xtype: 'button', text : 'Search', fieldLabel : "Présélect Region", 
						handler:function(){ShowGMapPopup({region:'Maniema'})}
					}
				]
			}
		]
    });

});