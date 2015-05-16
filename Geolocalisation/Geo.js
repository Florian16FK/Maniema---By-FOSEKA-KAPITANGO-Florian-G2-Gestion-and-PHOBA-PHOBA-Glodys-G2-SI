

Ext.namespace('JSF');
Ext.namespace('JSF.Components');

JSF.Components.JSF_Geo = Ext.extend(Ext.Window, {

    title: 'Recherche et localisation',
    width: 860,
    modal: true,
    closeAction: 'hide',
    closable: true,
    resizable: false,

    //ressources
    litEmptyText: 'Champ de recherche',
    litSearch: 'Rechercher',

    _initialised: false,

    defaultAdsres: undefined,
    defaultPoint: new google.maps.LatLng(-3.073092900000000000, 26.041388900000015000), 
    defaultZoom: 5,

    value: undefined,

    setValue: function (v) {
        var me = this;

        var emptyV = {
            adr: '', commune: '', cp: '', departement: '', region: '', pays: '', lat: '', lng: '',

            update: function (v) {
                Ext.apply(this, v);
            },

            toString: function () {
                var res = '';
                res += this.adr;
                if (this.commune && this.commune != '') res += (res == '' ? '' : ', ') + this.commune;
                if (this.cp && this.cp != '') res += (res == '' ? '' : ', ') + this.cp;
				if (this.departement && this.departement != '') res += (res == '' ? '' : ', ') + this.departement;
				if (this.region && this.region != '') res += (res == '' ? '' : ', ') + this.region;
                if (this.pays && this.pays != '') res += (res == '' ? '' : ', ') + this.pays;
                return res;
            },

            positionExist: function () {
                return this.lat != undefined && this.lat != ''
                    && this.lng != undefined && this.lng != ''
            },

            addresExist: function () {
                return (this.adr != undefined && this.adr != '')
                      || (this.commune != undefined && this.commune != '')
					  || (this.departement != undefined && this.departement != '')
					  || (this.region != undefined && this.region != '')
					  || (this.commune != undefined && this.commune != '')
                      || (this.cp != undefined && this.cp != '')
                      || (this.pays != undefined && this.pays != '')

            },

            getZoom: function () {
                if (this.adr != "") return 16;
                else if (this.commune != "") return 12;
                else if (this.departement != "") return 9;
                else if (this.region != "") return 8;
                else if (this.pays != "") return 6;
                else return undefined;
            },

            getLatLng: function () {
                return this.positionExist() ? (new google.maps.LatLng(this.lat, this.lng)) : undefined;
            },

            parseFromGInfo: function (gInfo) {
                this.parsePositionFromGInfo(gInfo);
                this.parseAddressFromGInfo(gInfo);
            },

            parsePositionFromGInfo: function (gInfo) {

                this.lat = gInfo.geometry.location.lat();
                this.lng = gInfo.geometry.location.lng();
            },

            parseAddressFromGInfo: function (gInfo) {
                if (gInfo.address_components) {
                    // parse adresse
                    this.adr = this.commune = this.cp = this.region = this.departement = this.pays = "";

                    for (var i = 0; i < gInfo.address_components.length; i++) {
                        var itemAdr = gInfo.address_components[i];
                        var type = itemAdr.types[0];

                        switch (type) {
                            case 'street_number':
                                this.adr = itemAdr.long_name + (this.adr == '' ? '' : ', ') + this.adr;
                                break;

                            case 'route':
                                this.adr += (this.adr == '' ? '' : ', ') + itemAdr.long_name;
                                break;

                            case 'locality':
                                this.commune = itemAdr.long_name;
                                break;

                            case 'postal_code':
                                this.cp = itemAdr.long_name;
                                break;

                            case 'administrative_area_level_1':
                                this.region = itemAdr.long_name;
                                break;

                            case 'administrative_area_level_2':
                                this.departement = itemAdr.long_name;
                                break;

                            case 'country':
                                this.pays = itemAdr.long_name;
                                break;
                        }
                    }
                }
            }
        };

        emptyV.update(v || {});
        this.value = emptyV;
		this.refresh();
    },
	
	refresh: function(){
		var me = this;
		if (this._initialised == true) {

            if (this.value.positionExist()) {
                // si la position est definis

                if (!this.value.addresExist()) this.getAddress(function () {
                    me.MarkerRefresh();
                });
                else this.MarkerRefresh();

            } else if (this.value.addresExist()) {
                // si l'adresse n'est pas vide
                this.getLocation(this.value.toString());
            } else {
                //si ni l'adresse ni coordonées 
				this.MarkerRefresh();
            }

        }
	},

    getValue: function () {
        return this.value;
    },


    initComponent: function () {
        var me = this;
        this.setValue(this.value);


        this.html = '<div id="' + this.id + "_gmap_content" + '" style="height:500px;"></div>';


        this.tbar = [
            '->',
            { xtype: 'textfield', emptyText: this.litEmptyText, width: this.width - 50, id: me.id + '_txtSearch',
                listeners: {
                    specialkey: function (f, e) {
                        if (e.getKey() == e.ENTER) {
                            var txtSearch = Ext.getCmp(me.id + '_txtSearch');
                            var str = txtSearch.getValue();
                            me.getLocation(str, true);
                        }
                    }
                }
            },
            { xtype: 'spacer', width: 5 },
            {
                xtype: 'button',
                iconCls: 'btnEditSearch',
                title: this.litSearch,
                margins: '1 2 1 2',
                handler: function () {
                    var txtSearch = Ext.getCmp(me.id + '_txtSearch');
                    var str = txtSearch.getValue();
                    this.getLocation(str, true);
                },
                scope: this
            }
        ],

        JSF.Components.JSF_Geo.superclass.initComponent.call(this);
    },


    listeners: {
        'afterrender': function (me) {

            var contenerHtml = document.getElementById(this.id + "_gmap_content");
			
            // positionement par defaut
            var latlng = this.value.getLatLng() || this.defaultPoint;
            var zoom = this.value.getZoom() ||this.defaultZoom;

            var myOptions = {
                center: latlng,
                zoom: zoom,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            this.map = new google.maps.Map(contenerHtml, myOptions);
            this._initialised = true;
			this.refresh();
        }
    },


    // positionement de pine
    MarkerRefresh: function () {

        var me = this;

        // nettoyage
        if (this.marker) {

            if (this.marker.infowindow) {
                this.marker.infowindow.close();
                this.marker.infowindow = undefined;
            }
            this.marker.setMap(null);
            this.marker = undefined;
        }

        var latlng = this.value.getLatLng();

        // marker position
        if (latlng != undefined) {

            //creation marker
            this.marker = new google.maps.Marker({
                position: latlng,
                draggable: true
            });

            //CLICK
            google.maps.event.addListener(this.marker, 'click', function (e) {
                if (me.marker.infowindow == undefined) me.showInfoWindow();
                else me.closeInfoWindow();
            });

            //DRAG END
            google.maps.event.addListener(this.marker, 'dragend', function (pos) {
                if (me.value) {
                    me.value.lat = pos.latLng.lat();
                    me.value.lng = pos.latLng.lng();
                    me.getAddress(function (result) { me.showInfoWindow(); });

                }
            });

            //DRAG START
            google.maps.event.addListener(this.marker, 'dragstart', function () {
                if (me.marker.infowindow) { me.closeInfoWindow(); }
            });

            this.marker.setMap(this.map);
            this.map.setOptions({ center: latlng, zoom: (this.value.getZoom() || this.defaultZoom) });
            this.showInfoWindow();

        } else {
            this.map.setOptions({ center:this.defaultPoint, zoom: this.defaultZoom });
        }
    },


    // recherche positionement de la carte par adresse
    getLocation: function (adr, bReplace) {
        var me = this;
        var adrStr = adr ? adr : this.value.toString();

        if (adrStr == '') {
            this.setValue();
            return;
        }

        var geocoder = new google.maps.Geocoder();

        geocoder.geocode({ 'address': adrStr }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {

                var res = results[0];
                if (bReplace == true) me.value.parseFromGInfo(res);
                else me.value.parsePositionFromGInfo(res);
                me.MarkerRefresh();

            } else {
                //erreur
                me.setValue();
            }
        });
    },

    getAddress: function (handlerResult) {

        var me = this;
        var latlng = this.value.getLatLng();


        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({ 'latLng': latlng }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                var res = results[0];
                me.value.parseAddressFromGInfo(res);
                if (handlerResult && res) handlerResult(res);

            } else {
                // erreur
            }
        });

    },

    valideLocalisation: function () {
        if (this._currentGeoFrmInfo != undefined) {
            var frm = this._currentGeoFrmInfo.getForm();
            if (frm) this.value.update(frm.getFieldValues())
            this.fireEvent("change", this.value);
            this.hide();
        }
    },

    removeLocalisation: function () {
        this.setValue();
        this.fireEvent("change", this.value);
        this.hide();
    },


    /****************/
    //  Show / Close

    closeInfoWindow: function () {
        if (this.marker && this.marker.infowindow) {
            this.marker.infowindow.close();
            this.marker.infowindow = undefined;
        }
    },


    // Affichage Info adresse
    showInfoWindow: function () {

        if (this.marker) {
            var windowW = 300;
            var labelW = 90;
			var padding = 15;
			
            var me = this;
            this.closeInfoWindow();

            var content = "<div id='" + this.id + "_GeoFrmInfoContainer' style='width:" + windowW + "px; height:160px'></div>";
            this.marker.infowindow = new google.maps.InfoWindow({ content: content });

            google.maps.event.addListener(this.marker.infowindow, 'domready', function () {



                me._currentGeoFrmInfo = new Ext.form.FormPanel({
                    renderTo: me.id + '_GeoFrmInfoContainer',
                    border: true,
                    autoScroll: false,
                    labelWidth: labelW,
                    bodyStyle: " padding:2px; padding-top:20px;",
                    items: [
                        { xtype: 'textfield', name: 'adr', value: me.value.adr, fieldLabel: 'Adresse', width: (windowW - labelW - padding) },
                        { xtype: 'textfield', name: 'commune', value: me.value.commune, fieldLabel: 'Commune', width: (windowW - labelW - padding) },
                        { xtype: 'textfield', name: 'cp', value: me.value.cp, fieldLabel: 'Code postal', width: (windowW - labelW - padding) },
                        { xtype: 'label', html: me.value.lat.toString().substring(0, 12) + " / " + me.value.lng.toString().substring(0, 12), fieldLabel: 'Lat / lng', width: (windowW - labelW - padding) }
                    ],
                    bbar: [
                    { text: "Supprimer", handler: me.removeLocalisation, scope: me },
                    '->',
                    { text: "Valider", handler: me.valideLocalisation, scope: me }
                    ]
                });
            });

            google.maps.event.addDomListener(this.marker.infowindow, 'closeclick', function () { me.marker.infowindow = undefined; });

            this.marker.infowindow.open(this.map, this.marker);

        }
    }
});

Ext.reg('JSF_Geo', JSF.Components.JSF_Geo);