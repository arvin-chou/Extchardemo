Ext.Loader.setConfig({enabled: true});
Ext.Loader.setPath('Ext.ux'      , 'js'               );
Ext.require('Ext.ux.form.MultiSelect');
Ext.require('Ext.ux.LiveSearchGridPanel');

Ext.onReady(function () {
    var me = this;
    
    //------------setting start
    var refresh_rate = 5000;
    var refresh_all_rate = 20000;
    var img_extension = '.gif';
    var refresh_all_rate_enable = 0;
    var showImg = 0;
    var ghost = '0.0.0.0';
    var isGenerate = 1;
    //------------setting end


    var grid_column_height_padding = '<div style="visibility:hidden">i</div>';
    var pageSize                   = 5;
    var start                      = 1;
    var firstLoadRecord            =[];
    var i = showImg ? 7 : 12;
    for(; i>0; i--){
    }
    //var host= 'http://192.168.10.178:8080';
    host = '';
    var url = host + '/index2.cgi';
    var length = { 
        name : 50, description: 250, container: 550,
        labelWidth: 50, width :150 , enable_controls : 400,
        user_info: 400, grid_qos_width: 280, long_name : 100,
        window_width: 1000, window_height: 600,
        grid_qos_height: 300,
        chart_width: 400, chart_height: 150,
        chart_pie_height: 300,
        image_width : 120,
        donut: 20
    };
    var style =  {
        basic : {
            background: 'transparent',
            padding: '10px'
        }
    }

    //------create form
    var form_user_info_detail = {};
    form_user_info_detail = Ext.create('Ext.form.Panel', {
        width : length.window_width - length.grid_qos_width,
        bodyStyle: style.basic,
        hidden : true,
        layout : {
            type: 'table',
            columns: 3
        }
    });
    var all_info_detail = {};
    var current_user 

    
    var intervalid = {
        app_qos: -1,
        all    : -1,
        grid_qos: -1,
        grid_qos_all_app_detail: -1,
	grid_qos_app_detail: -1
    }
    var app_count = {
    }
    var storeId = {};
    var app_ceil= {};
    var individual_totalapp = {};
    var count = 0;
    
    var user_info_mapping = ['uid', 'mac', 'host', 'os_name', 'os_vendor', {name:'uptime',mapping:'uptime'}, 'ipv4', 'weight', 'upload', 'device_profile', 'device_priority', 'schedule', 'download'];
    var qos_priority_mapping = ['id', 'name'];

    var qos_app_cat = ['id', 'name'];

    var user_info_app_mapping = ['host', 'app_name', 'app_quality', 'app_upload', 'app_download', 'app_id' ];
    //copy from user_info_mapping
    var user_info_app_mapping = user_info_mapping.slice();
    user_info_app_mapping.push(
        {name :'user', mapping: 'user'},
        {name :'mac', mapping: 'mac'},
        {name :'app_id', type: 'int'},
        {name :'cat_id', type: 'int'},
        {name :'cat'},
        {name :'app'},
        {name :'down_rate', mapping: 'down_rate', type: 'int'},
        {name :'down_cfg_rate', mapping: 'down_cfg_rate', type: 'int'},
        {name :'down_cfg_ceil', mapping: 'down_cfg_ceil', type: 'int'},
        {name :'down_prio', mapping: 'down_prio'},
        {name :'down_sent', mapping: 'down_sent', type: 'int'},
        {name :'down_sent_byte', mapping: 'down_sent_byte'},
        {name :'up_rate', mapping: 'up_rate', type: 'int'},
        {name :'up_cfg_rate', mapping: 'up_cfg_rate', type: 'int'},
        {name :'up_cfg_ceil', mapping: 'up_cfg_ceil', type: 'int'},
        {name :'up_prio', mapping: 'up_prio'},
        {name :'up_sent', mapping: 'up_sent', type: 'int'},
        {name :'up_sent_pkt', mapping: 'up_sent_pkt'}
    );
    var qos_priority_data = [];
    var store_app_cat_array = {};

    Ext.define('model_user_info', {
        extend: 'Ext.data.Model',
        fields: user_info_mapping
    });

    Ext.define('model_app_info', {
        extend: 'Ext.data.Model',
        fields: user_info_app_mapping,
        /*
        proxy: {
            type: 'ajax',
            api: {
                create  : url ,
                update  : url ,
                destroy : url 
            },
            reader: {
                type: 'json',
                root: 'xmldata',
                record: 'record',
                successProperty: 'success',
                totalProperty : 'total'
            }
        }
        */
    });

    Ext.define('model_qos_mapping', {
        extend: 'Ext.data.Model',
        fields: qos_priority_mapping
    });

    //pagingtoolbar
    var pagingcombo = Ext.create('Ext.form.ComboBox',{
        store: Ext.create('Ext.data.Store', {
            fields : ['name','value'],
            data   : [
                {name : '5' ,   value: '5'},
                {name : '10',   value: '10'},
                {name : '20',   value: '20'},
                {name : '30',   value: '30'},
                {name : '50',   value: '50'},
                {name : '100',   value: '100'}
            ]
        }),
        displayField : 'name',
        valueField : 'value',
        editable : false,
        fieldLabel  : 'page size',
        labelSeparator : ' ',
        labelWidth: 60,
        value : pageSize, //initial
        width : 100
    });
    pagingcombo.on('select', function(pagingcombo) {
        var itemsPerPage = parseInt(pagingcombo.getValue());
        store_app.pageSize = itemsPerPage;
        paging.pageSize = itemsPerPage;
        paging.moveFirst();

    }, grid_qos_app_detail);

    
    Ext.define('chartPaging', {
        extend : 'Ext.toolbar.Paging',
        alias : 'widget.chartPaging',
        displayInfo: true,
        config : {
            pageParamsAction : { 'action' : 'filter' } ,
            filterParams : {}
        },
        doRefresh : function(){
            var me = this,
            current = me.store.currentPage;

            if (me.fireEvent('beforechange', me, current) !== false) {
                me.store.load({
                    params  : me.store.params,
                    callback: function(records, operation, success) {
                        var cursor = (current-1)*me.pageSize;
                        me.filterStore( me , cursor );
                    }
                });
            }		
        },
        moveFirst : function(){
            var me=this;

            if (me.fireEvent('beforechange', me, 1) !== false){
                me.store.currentPage = 1;
                var cursor = (1-1)*me.pageSize;
                this.filterStore( me , cursor );

                this.onLoad();
            }
        },
        movePrevious : function(){
            var me = this,
            prev = me.store.currentPage - 1;

            if (prev > 0) {
                if (me.fireEvent('beforechange', me, prev) !== false) {
                    me.store.currentPage = prev;
                    var cursor = (prev-1)*me.pageSize;
                    this.filterStore( me , cursor );

                    this.onLoad();
                }
            }
        },
        moveNext : function(){
            var me = this,
            total = me.getPageData().pageCount,
            next = me.store.currentPage + 1;

            if (next <= total) {
                if (me.fireEvent('beforechange', me, next) !== false) {
                    //me.store.nextPage();
                    me.store.currentPage = next;
                    var cursor = (next-1)*me.pageSize;
                    this.filterStore( me , cursor );

                    this.onLoad();
                }
            }

        },
        moveLast : function(){
            var me = this,
            last = me.getPageData().pageCount;

            if (me.fireEvent('beforechange', me, last) !== false) {
                me.store.currentPage = last;
                var cursor = (last-1)*me.pageSize;
                this.filterStore( me , cursor );

                this.onLoad();
            }
        },
        filterStore : function( self , cursor ){
            var dcnt = 0;
            var _st = cursor;
            var _ed = cursor + self.pageSize;
            self.store.filterBy(function(record, id){
                dcnt++;
                if((dcnt > _st)&&(dcnt <= _ed))
                return true;
                else
                return false;
            });
        }
    });
    var paging = Ext.create( 'chartPaging', {
        store : store_app ,
        height: 26,
        dock  : 'bottom',
        pageSize : pageSize,
        items: [ '-' , {
            xtype : 'tbspacer',
            width : 15
        },
        pagingcombo]
    });
    //end

    var get_row_template = function(gridId, type)
    {
        var div = '<div style="width:100%;height:100px">';
        if( 1 == gridId){
            switch(type){
                case 2:
                //div     +='<image id="quality_0_{0}_{1}_{2}" style="position:relative;top:40px;"width="40px"src="images/quality/{3}'+img_extension+'"/>';
                div     +='<div id="quality_0_{0}_{1}_{2}" style="position:relative;top:40px;background-color:{3}"width="40px"height="40px"  >{3}</div>';
                div     += '</div>';
                break;
                case 1:
                div = '<div style="width:100%;height:100%">';
                if( showImg ){
                    div     +='<div style="position:relative;float:left;width:50%"><image width="120px"src="images/app/{0}'+img_extension+'"/></div>';
                }
                else{
                    div     +='<div style="position:relative;float:left;width:50%;display:none">{0}</div>';
                }
                div     +='<div style="position:relative;float:right;width:50%">{1}</div>';
                div     +='<div style="position:relative;float:right;width:1px">{2}</div>';
                div     +='<div>mac:{3}</div>';
                div     +='<div>application:{0}</div>';
                div     +='</div>';
                break;
            }
        }
        return div;
    }


    var get_error_info = function(err){
        if( err ){
            var caller_line = err.stack.split("\n")[4];
            var index = caller_line.indexOf("at ");
            var clean = caller_line.slice(index+2, caller_line.length);
            console.log( 'line: ', (new Error).lineNumber, ' ' ,arguments.callee.name, ": arguments caller_line=", caller_line, " index=", index, " clean=", clean, arguments, err);
        }
        return false;
    }
    var get_store_max_record = function(id, isup_ceil){
        //fields: ['link', 'rate', 'ceil', 'sent', 'org_rate', 'org_ceil', 'org_sent']
        if(id){
            try{
                var chart = Ext.getCmp(id);
                isup_ceil = isup_ceil || 0;
                //var value = chart.store.data.items[isup_ceil].get(field);
                var record= chart.store.data.items[isup_ceil]; 
                var value = record.get('org_rate') + record.get('org_ceil') + record.get('org_sent');
                return get_unit(value);
            }
            catch(err){
                //get_error_info(err);
            }
        }
        return 300;
    }

    var get_generate_data = function(type, count){
        type = type || 1, count = count || 20;
        var records = [];
        var mac = '00:16:b2:dc:30:f';
        var app_cat = [['1','Instant messaging'], ['2','P2P'], ['3','File Transfer'], ['4','Voice over IP'], ['5','Database'], ['6','Games'], ['7','Network Management'], ['8','Remote Access Terminals'], ['9','Bypass Proxies and Tunnels'], ['10','Stock Market'], ['11','Web / Web 2.0'], ['12','Security Update'], ['13','Web IM'], ['14','Mail and Collaboration'], ['15','Business'], ['16','Streaming Media'], ['17','Private Protocol'], ['18','Network Protocols'], ['19','Mobile'], ['20','Social Network']];

        var app_name = ['Instant messaging' ,'MSN' ,'Yahoo Messenger' ,'ICQ/AIM/iIM' ,'QQ/TM' ,'IRC' ,'Yoics' ,'Rediff BOL' ,'Google Talk' ,'Gadu-Gadu' ,'POPO' ,'Tlen' ,'Wlt' ,'RenRen' ,'IPMSG' ,'Mail.ru IM' ,'Kubao' ,'Lava-Lava' ,'PaltalkScene' ,'UcTalk' ,'WinpopupX' ,'ISPQ' ,'ChatON(M)' ,'Caihong' ,'IMVU' ,'Instan-t' ,'PiIM' ,'Xfire' ,'WhatsApp(M)' ,'Userplane' ,'Camfrog' ,'Message Send Protocol' ,'Fetion' ,'Heyyo' ,'Alicall' ,'Qeshow' ,'MissLee' ,'Jctrans' ,'BaiduHi' ,'TELTEL' ,'9158' ,'Kltx' ,'IM+(M)' ,'Imi' ,'Netcall' ,'ECP' ,'Etnano' ,'Dii' ,'Weibo IM' ,'Trillian' ,'HipChat' ,'IntraMessenger' ,'BitWise' ,'Barablu' ,'Whoshere(M)' ,'LiiHo(M)' ,'Appme(M)' ,'Verychat(M)' ,'Voxer(M)' ,'TextMe(M)' ,'Bump(M)' ,'CoolMessenger' ,'NateOn' ,'WeChat(M)' ,'P2P' ,'BitTorrent Series' ,'DirectConnect' ,'eDonkey Series' ,'FastTrack' ,'Gnutella' ,'Foxy' ,'Winny' ,'POCO' ,'ClubBox' ,'Vagaa' ,'Share' ,'Thunder Series' ,'myMusic' ,'QQDownload' ,'easyMule' ,'Fileguri' ,'Soulseek' ,'GNUnet' ,'XNap' ,'Kceasy' ,'Aria2' ,'Arctic' ,'Artemis' ,'Bitflu' ,'BTG' ,'Pando' ,'Lphant' ,'BitBlinder' ,'Deepnet Explorer' ,'aMule' ,'Ares' ,'Azureus' ,'BCDC++' ,'BitBuddy' ,'BitComet' ,'ApexDC++' ,'Bearshare' ,'BitLord' ,'BT++' ,'Shareaza' ,'eMule' ,'eMule Plus' ,'FileScope' ,'GoGoBox' ,'Hydranode' ,'BitTorrent Pro' ,'Kazaa Lite Tools K++' ,'BitRocket' ,'MlDonkey' ,'MooPolice' ,'Phex' ,'RevConnect' ,'Rufus' ,'SababaDC' ,'Shareaza Plus' ,'BTSlave' ,'TorrentStorm' ,'uTorrent' ,'ZipTorrent' ,'BitPump' ,'BBtor' ,'Tuotu' ,'BitWombat' ,'Vuze' ,'Bittorrent X' ,'DelugeTorrent' ,'CTorrent' ,'Propagate Data Client' ,'EBit' ,'Electric Sheep' ,'FileCroc' ,'FoxTorrent' ,'GSTorrent' ,'Hekate' ,'Halite' ,'hMule' ,'KGet' ,'KTorrent' ,'LeechCraft' ,'LH-ABC' ,'libTorrent' ,'LimeWire' ,'Meerkat' ,'MonoTorrent' ,'MoonlightTorrent' ,'Net Transport' ,'OneSwarm' ,'OmegaTorrent' ,'Protocol::BitTorrent' ,'PHPTracker' ,'qBittorrent' ,'Qt 4 Torrent example' ,'Retriever' ,'RezTorrent' ,'Swiftbit' ,'SoMud' ,'SwarmScope' ,'SymTorrent' ,'Sharktorrent' ,'Terasaur Seed Bank' ,'TorrentDotNET' ,'Transmission' ,'uLeecher' ,'BitLet' ,'FireTorrent' ,'XSwifter' ,'XanTorrent' ,'Xtorrent' ,'Pruna' ,'Soribada' ,'Gample' ,'DIYHARD' ,'LottoFile' ,'ShareBox' ,'Bondisk' ,'Filei' ,'KDISK' ,'Ondisk' ,'FILEJO' ,'FILEDOK' ,'Santa25' ,'Webhard' ,'TPLE' ,'DiskPump' ,'NETFOLDER' ,'QFILE' ,'DISKMAN' ,'DBGO' ,'Congaltan' ,'Diskpot' ,'Ipopclub' ,'Yesfile' ,'Nedisk' ,'Me2disk' ,'Odisk' ,'Tomfile' ,'Adrive.co.kr' ,'ZIOfile' ,'APPLEFILE' ,'SUPERDOWN' ,'Hidisk' ,'Downs' ,'DownDay' ,'BOMULBOX' ,'FILEHAM' ,'Tdisk' ,'Filehon']

        var os_name = ['Acorn Computers', 'Amiga Inc.', 'Apple Inc.', 'Apollo Computer', 'Atari', 'BAE Systems', 'Be Inc.', 'Bell Labs', 'Bull SAS', 'Burroughs Corporation', 'Control Data Corporation', 'Convergent Technologies', 'Data General', 'DataPoint', 'DDC-I, Inc.', 'Digital Research, Inc.', 'Digital/Tandem Computers/Compaq/HP', 'ENEA AB', 'Fujitsu', 'Google', 'Green Hills Software', 'Heathkit/Zenith Data Systems', 'Hewlett-Packard', 'Honeywell', 'Intel Corporation', 'IBM', 'LynuxWorks <br/>(originally Lynx <br />Real-time Systems)', 'Micrium Inc.', 'Microsoft Corporation', 'MontaVista Software', 'NCR Corporation', 'Novell', 'Quadros Systems', 'RCA', 'RoweBots', 'Samsung Electronics', 'SCO / The SCO Group[3]', 'Scientific Data <br />Systems (SDS)', 'SYSGO', 'TRON Project', 'Unisys', 'UNIVAC (later Unisys)', 'Wang Laboratories', 'Wind River Systems'];

        var host = ['barrel-of-knowledge.info', 'barrell-of-knowledge.info', 'better-than.tv', 'blogdns.org', 'blogsite.org', 'boldlygoingnowhere.org', 'dnsalias.org', 'dnsdojo.org', 'doesntexist.org', 'dontexist.org', 'doomdns.org', 'dvrdns.org', 'dynalias.org', 'dyndns.info', 'dyndns.org', 'dyndns.tv', 'dyndns.ws', 'for-our.info', 'forgot.her.name', 'forgot.his.name', 'from-me.org', 'ftpaccess.cc', 'game-host.org', 'game-server.cc', 'go.dyndns.org', 'gotdns.org', 'groks-the.info', 'groks-this.info', 'here-for-more.info', 'hobby-site.org', 'home.dyndns.org', 'homedns.org', 'homeftp.org', 'x.org', 'homeunix.org', 'is-a-bruinsfan.org', 'is-a-candidate.org', 'is-a-celticsfan.org', 'is-a-chef.org', 'is-a-geek.org', 'is-a-knight.org', 'er.org', 'fan.org', 'is-a-soxfan.org', 'is-found.org', 'is-lost.org', 'is-saved.org', 'is-very-bad.org', 'is-very-evil.org', 'is-very-good.org', 'is-very-nice.org', 'is-very-sweet.org', 'isa-geek.org', 'kicks-ass.org', 'knowsitall.info', 'ed.org', 'myphotos.cc', 'on-the-web.tv', 'podzone.org', 'readmyblog.org', 'scrapping.cc', 'selfip.info', 'selfip.org', 'sellsyourhome.org', 'servebbs.org', 'serveftp.org', 'servegame.org', 'stuff-4-sale.org', 'webhop.info', 'webhop.org', 'worse-than.tv'];
        switch(type){
            //get Category
            case 3:

            for(var i =0;i<count;i++){
                for(var i=0,count=app_cat.length;i<count ;i++){
                    var app = Ext.create('model_qos_mapping', {
                        id     : (app_cat[i])[0],
                        name   : (app_cat[i])[1]
                    });
                    records.push( app );
                }
            }
            break;
            //get bw
            case 2:
            for(var i =0;i<count;i++){
                //check is first load and keep id, otherwise refresh other metric
                var flag = 0;
                if( 0 == firstLoadRecord.length ){
                }
                else{
                    flag = 1;
                }
                //end
                //generate virtual app
                var Totalcat = app_cat.length;
                var Totalapp = app_name.length;
                for(var i=0;i<count * 3;i++){
                    var cat_id, mac_idm, app_id, up, down;
                    down = [Math.random() * 100, Math.random() * 1000, Math.random() * 20000];
                    up   = [Math.random() * 50,  Math.random() * 100,  Math.random() * 1000 ];
                    down.sort();
                    up.sort();
                    var app = Ext.create('model_app_info', {
                        //app_name     : app_name[i],
                        //cat_id       : app_cat[Math.floor(Math.random() * 20)],
                        down_rate    : Math.random() * 20,
                        down_cfg_rate: down[1], 
                        down_cfg_ceil: down[2],
                        down_prio    : Math.random() * 1,
                        down_sent    : down[0],
                        down_sent_byte:Math.random() * 0,
                        up_rate      : Math.random() * 50,
                        up_cfg_rate  : up[1], 
                        up_cfg_ceil  : up[2],
                        up_prio      : Math.random() * 1,
                        up_sent      : up[0],
                        up_sent_pkt  : 0,
                        //mac:mac + parseInt(i, 16)
                    });
                    if( flag ){
                        var saveId = firstLoadRecord[i].split('|');
                        mac_id = saveId[0].replace(/_/g, ':');
                        cat_id = saveId[1];
                        app_id = saveId[2];
                        app.set('app_name', app_name[app_id]);
                        app.set('cat_id', cat_id);
                        app.set('app_id', app_id);
                        app.set('mac', mac_id);
                    }
                    else{
                        cat_id = (app_cat[Math.floor(Math.random() * Totalcat)])[0];
                        mac_id = mac + (parseInt(i, 16) % (count *2));
                        app_id = Math.floor(Math.random() * Totalapp);
                        app.set('app_name', app_name[app_id]);
                        app.set('cat_id', cat_id);
                        app.set('app_id', app_id);
                        app.set('mac', mac_id);
                        
                        var id = Ext.String.format( '{0}|{1}|{2}', mac_id.replace(/:/g, '_'), cat_id, app_id);
                        firstLoadRecord.push(id);
                    }
                    records.push( app );
                }
            }
            break;
            //get all user
            case 1:
            default:
            var Totalos_name = os_name.length;
            var Totalhost = host.length;
            for(var i =0;i<count;i++){
                var ip = [];
                for(j=0;j<4;j++){
                    ip.push(Math.floor(Math.random() * 255));
                }
                var user = Ext.create('model_user_info', {
                    uid:i,
                    host: host[Math.floor(Math.random() * Totalhost)],
                    os_name: os_name[Math.floor(Math.random() * Totalos_name)],
                    uptime: i * Math.random() * 1000,
                    ipv4: ip.join('.'),
                    upload:Math.random() * 1000,
                    download: i * Math.random() * 5000,
                    device_priority:0,
                    mac:mac + parseInt(i, 16)
                });
                records.push( user );
            }
            break;
        }
        return records;
    }
    var schedule_mapping = {
        0 : 'weekday'           ,
        1 : 'weekend'           ,
        2 : 'middle night'      
    };
    var device_profile_mapping = {
        0 : 'entertainmant'
    };
    var device_priority_mapping = {
        0 : 'low',
        1 : 'low'
    };
    var os_name_icon_mapping = {
        all     : 'network',
        windows : 'ms_win8',
        1 : 'low'
    };
    var app_quality_mapping = ['grey', 'red', 'orange', 'green'];

    var set_timeToGmt = function(unix_timestamp){
        unix_timestamp = parseInt( unix_timestamp, 10 );
        var hours = Math.floor(unix_timestamp / (60 * 60));
        var divisor_for_minutes = unix_timestamp % (60 * 60);
        var minutes = Math.floor(divisor_for_minutes / 60);
        var divisor_for_seconds = divisor_for_minutes % 60;
        var seconds = Math.ceil(divisor_for_seconds);
        return hours + 'h:' + minutes + 'm:' + seconds + 's';
    }

    //------user store
    var store = Ext.create('Ext.data.JsonStore', {
        model : 'model_user_info',
        proxy : {
            type: 'ajax',
            url: url,
            reader: {
                type: 'json'
            }
        },
        //autoLoad: true,

    });
    
    var store_app_cat = Ext.create('Ext.data.JsonStore', {
        //fields : qos_app_cat,
        model   : model_qos_mapping,
        params  : { 
            'action' : 'get_all_cat' 
        },
        proxy : {
            type: 'ajax',
            url: url,
            reader: {
                type: 'json'
            }
        }
    });
        
    var store_app = Ext.create('Ext.data.JsonStore', {
        model : 'model_app_info',
        proxy : {
            type: 'ajax',
            url: url,
            reader: {
                type: 'json'
            }
        },
        pageSize : pageSize,
        currentPage : start
    });
    
    //divide grid store
    var store_app_flow = Ext.create('Ext.data.JsonStore', {
        model : 'model_app_info',
        params  : { 
            'action' : 'get_all_app' 
        },
        proxy : {
            type: 'ajax',
            url: url,
            reader: {
                type: 'json'
            }
        },
        pageSize : pageSize,
        currentPage : start
    });

    var get_apps_is_add = function( records, field, value ){
        var count = 0;
        for (var j = 0, l = records.length; j < l; j++){
            r = records[j];
            if( value == r.get(field) ){
                count ++;
            }
        }
        if( count == app_count[field] ){
            return true;
        }
        if( undefined == app_count[field] ){
            app_count[field] = count;
            return true;
        }
        if( count != app_count[field] ){
            app_count[field] = count;

            grid_qos.fireEvent('itemclick', grid_qos_user_info, grid_qos.getSelectionModel().getSelection()[0] );
            return false;
        }
    }
    var get_unit = function( unit ){
        //1, 10^3, 10^6, 10^9
        var size = ['bytes', 'Kbytes', 'MB', 'GB'];
        var length = size.length;
        if( unit < 0 ){
        }
        else{
            for( var i=length; i > 0; i-- ){
                var quotient = unit / Math.pow(10, 3*(i-1));
                if( quotient >= 1 ){
                    return quotient.toFixed(2) + ' ' + size[i-1];
                }
            }
        }
        return 0 + ' ' + size[0];
    }

    //main interval
    var get_store_app_flow_interval = function(){
        store_app_flow.load({
        //store_app.load({
            params  : { 
                'action' : 'get_all_app' 
            },
            callback : function(records){
                if( isGenerate ){
                    records = get_generate_data(2);
                }

                Ext.suspendLayouts();
                var data = [], aggregate_data={};
                var link = ['down', 'up'];
                var sent, rate, ceil, total;
                var total_down_sent = total_up_sent = 0;
                var isgetAll = 0;
                var totalCount=0;
                var mac ;
                var orderby = 'down_rate';
                var current_records = {};
                //get active user
                var form = form_user_info_detail.getForm();
                var form_record = form.getRecord(); 
                // in qos get all
                var current_item_click = grid_qos.getSelectionModel().getSelection()[0] || -1 ;

                //default in page first loading
                if( -1 == current_item_click ){
                    isgetAll = 1;
                }
                else{
                    if( -1 == current_item_click.get('uid') ){
                        isgetAll = 1;
                    }
                    else{
                        //for ff
                        if( form_record.length > 1 ){
                            //form_record = form_record[0];
                        }
                        //console.log( form_record );
                        form_record = current_item_click;
                        mac = form_record.get('mac');

                        if( !get_apps_is_add(records, 'mac', mac) ){
                            //return false;
                        }
                    }
                }

                //only current show store must refresh
                if( isgetAll ){

                    store_app.totalCount = records.length;
                    paging.bindStore(store_app);

                    for(var i=(store_app.currentPage-1)*pageSize,j=i+pageSize;i<j;i++){
                        var r  = records[i];
                        if( r ){
                            var id = Ext.String.format( '{0}_{1}_{2}', r.get('mac').replace(/:/g, '_'), r.get('cat_id'), r.get('app_id'));
                            //use same chart
                            if(isgetAll){
                            }
                            //end
                            //id = '0_' + id;
                            current_records[id] = id;
                        }
                        else{
                            break;
                        }
                    }
                }
                else{
                    //travel all records and get specific records by mac
                    var tmp_records = [];
                    for (var j = 0, l = records.length; j < l; j++){
                        var r = records[j];
                        if( mac == r.get('mac')){
                            tmp_records.push(r);
                        }
                    }
                    store_app_flow.loadData(tmp_records);
                    store_app_flow.totalCount = tmp_records.length;
                    paging.bindStore(store_app_flow);
                    for(var i=(store_app_flow.currentPage-1)*pageSize,j=i+pageSize;i<j;i++){
                        var r  = tmp_records[i];
                        if( r ){
                            var id = Ext.String.format( '{0}_{1}_{2}', r.get('mac').replace(/:/g, '_'), r.get('cat_id'), r.get('app_id'));
                            current_records[id] = id;
                        }
                        else{
                            break;
                        }
                    }
                }
                //console.log('current_records=',current_records);
                
                /*
                records = records.sort(function(a, b){
                    return b.get(orderby) - a.get(orderby);
                });
                */
                for (var j = 0, l = records.length; j < l; j++){
                    r = records[j];
                    var cat_id = r.get('cat_id');
                    if( isgetAll ){
                        mac = r.get('mac');
                        if(! (cat_id in aggregate_data) ){
                            aggregate_data[cat_id] = 0;
                        }
                        aggregate_data[cat_id]+= r.get('down_sent');
                        //console.log( 'down_sent', cat_id, r.get('down_sent') );
                    }

                    if( mac == r.get('mac')){
                        //totalCount++;
                        var flag = 0;
                        var id = Ext.String.format( '{0}_{1}_{2}', r.get('mac').replace(/:/g, '_'), r.get('cat_id'), r.get('app_id'));
                        //use same chart
                        if(isgetAll){
                            isgetAll = 0;
                            flag     = 1;
                        }
                        //end
                        //id = isgetAll + '_' + id;
                        //console.log('in interval, id=',id, ',storeId=', storeId);
                        if( id in storeId ){
                            var chart = storeId[id];
                            //console.log( chart, 'id', id );
                            if( chart.store ){
                                if( id in current_records){
                                    console.log( "isgetAll: ", isgetAll, ",id=", id, ',storeId=', storeId );
                                    Ext.defer(function(id, r) {
                                        console.log('in interval derfer, id=',id,',r=',r, this);
                                        var chart = storeId[id];
                                        var data = set_bar_store(r);
                                        chart.store.loadData( data );
                                    },(++totalCount)* 100, this, [id, r]);
                                    //data = set_bar_store(r);
                                    //chart.store.loadData( data );
                                }
                            }
                        }

                        //resume status
                        if(flag){
                            isgetAll = 1;
                        }
                        //end

                        //replace quality img
                        var img = document.getElementById('quality_' + id);
                        if( img ){
                            var quality = get_app_quality(r);
                            //img.src = 'images/quality/'+quality+img_extension;
                            img.style.backgroundColor=quality;
                            img.innerHTML = quality;
                        }

                        total_down_sent += r.get('down_sent');
                        total_up_sent += r.get('up_sent');
                    }
                }
                //
                //refresh pie chart 
                if( isgetAll ){
                    var pie_chart = Ext.getCmp('chart_all_qos');
                    var count = [];
                    for( var i in aggregate_data ){
                        count.push({name: store_app_cat_array[i] , value: aggregate_data[i] });
                    }
                    console.log( 'pie:', count , aggregate_data);
                    pie_chart.store.loadData(count);
                    //pie_chart.setWidth( length.chart_width );
                    //pie_chart.setHeight( length.chart_pie_height );
                    pie_chart.refresh();
                }
                else{
                    form_record.set('upload', get_unit( total_up_sent ));
                    form_record.set('download', get_unit( total_down_sent ) );
                    //if(1 != parseInt(form_record.get('uptime'), 10)){
                    //    form_record.set('uptime', set_timeToGmt( form_record.));
                    //}
                    form_user_info_detail.loadRecord(form_record);
                }


                if( grid_qos_app_detail.body.isMasked()){
                    grid_qos_app_detail.body.unmask();
                }
                //grid_qos_app_detail.store.totalCount = totalCount;
                //paging.bindStore(grid_qos_app_detail.store);
                Ext.resumeLayouts(true);
            }
        });
    }

    // get quality img
    var get_app_quality = function( record ){
        //only download
        var link_type = 'down';
        var color = 0;

        if( undefined == record.get(link_type + '_rate')){
            return app_quality_mapping[color];
        }

        //if( record.get(link_type + '_rate') > record.get(link_type+'_cfg_ceil') )
        if( record.get(link_type + '_rate') > record.get(link_type+'_cfg_rate') * 1.25 )
        {
            //red
            color = 1;
        }
        else{
            //orange
            if( record.get(link_type + '_rate') > record.get(link_type+'_cfg_rate') * 0.75 ){
                color = 2;
            }
            else{
                color = 3;
            }
        }
        return app_quality_mapping[color];
    }

    var toggle_to_all = function(isAll){
        Ext.suspendLayouts();
        if( isAll ){
            all_info_detail.setVisible(isAll);
            form_user_info_detail.setVisible(!isAll);
            grid_qos_app_detail.setVisible(isAll);
            grid_qos_app_detail.setHeight(length.window_height-(all_info_detail.getHeight())-paging.getHeight()*2);
        }
        else{
            all_info_detail.setVisible(isAll);
            form_user_info_detail.setVisible(!isAll);
            if( current_user ){
                current_user.set('uptime', set_timeToGmt(current_user.get('uptime')));
                form_user_info_detail.loadRecord(current_user);
            }
            grid_qos_app_detail.setVisible(!isAll);
            grid_qos_app_detail.setHeight(length.window_height-(form_user_info_detail.getHeight())-paging.getHeight()*2);
        }

        //create bar chart
        store_app.currentPage = 1;
        store_app.load({
            params  : { 
                'action' : 'get_all_app' 
            },
            callback: function( records ){
                if( isGenerate ){
                    records = get_generate_data(2);
                }
                if( !current_user ){
                }
                else{
                    if( -1 != current_user.get('uid') ){
                        var rs  = records.slice();
                        records = [];
                        for (var j = 0, l = rs.length; j < l; j++){
                            r = rs[j];
                            if( current_user.get('mac') == r.get('mac') ){
                                records.push( r );
                            }
                        }
                    }
                }
                    //load limit page
                    /*
                    var records_paging = [ 
                        ]; 
                        for(var i=(store_app.currentPage-1)*pageSize,l=start+pageSize;i<l;i++){
                        records_paging.push(records[i]);
                    }
                    */
                    //end

                    //store_app.loadData( records_paging ); 
                    store_app.loadData( records ); 
                    set_aggrigate_app();
                    //first filter store
                    /*
                    */
                    //store_app.clearFilter(true);
                    var dcnt = 0;
                    var _st = (store_app.currentPage-1)*pageSize;
                    var _ed = (store_app.currentPage-1) + pageSize;
                    store_app.filterBy(function(record, id){
                        dcnt++;
                        if((dcnt > _st)&&(dcnt <= _ed))
                        return true;
                        else
                        return false;
                    });
                    //end
                    store_app.totalCount = records.length;
                    grid_qos_app_detail.bindStore(store_app);
                    paging.bindStore(store_app);
                    paging.doRefresh();
                    console.log(paging, 'paging', store_app, store_app.totalCount);
                    //paging.doRefresh();
                if( isAll ){
                }
                else{
                    //store_app.loadData( records ); 
                }
            }
        });
        clearInterval(intervalid.app_qos);
        if( Ext.getCmp('pause').text == 'resume' ){
        }
        else{
            intervalid.app_qos= setInterval( get_store_app_flow_interval, refresh_rate );
        }
        Ext.resumeLayouts(true);
    }

    function get_recordsby(records, fieldName, value){
        var recs = [];
        for (var j = 0, l = records.length; j < l; j++){
            rec = records[j];
            if( value == rec.get(fieldName) ){
                recs.push( rec );
            }
        }
        return recs;
    }
    function set_aggrigate_app(){
        individual_totalapp = {};
        var r, mac;
        for(var i=0,j=store_app.data.items.length;i<j;i++){
            r = store_app.data.items[i];
            mac = r.get('mac');
            if(!(mac  in individual_totalapp)){
                individual_totalapp[mac] = 1;
            }
            else{
                individual_totalapp[mac]++;
            }
        }
        individual_totalapp['all'] = j;
    }
    function get_aggrigate_app(mac){
        return individual_totalapp[mac] || 0;
    }
    function get_top_recordsby(records, key){
        //sort by down_sent desc, bubble sort
        key = key || 'down_sent';
        var recs = [], values = [] ;
        recs = records.sort(function(a, b){
            return b.get(key) - a.get(key);
        });
        return recs;
    }

    function render_app_to_grid(value, metaData, r, row, col)
    {
        var id = Ext.String.format( '{0}_{1}_{2}', r.get('mac').replace(/:/g, '_'), r.get('cat_id'), r.get('app_id'));
        //id = (col-2) + '_' + id;
        var data = set_bar_store(r);
        var max  = 300, bar_store, bar;

        if( !(id in storeId) ){
            bar= Ext.create('Ext.chart.Chart', {
                animate: true,
                id     :'chart_' + id,
                //maximizable: true,
                autoShow: true,
                layout: 'fit',
                //resize: true,
                width: length.chart_width,
                height: length.chart_height - 70,
                store: Ext.create('Ext.data.JsonStore', {
                    fields: ['link', 'rate', 'ceil', 'sent', 'org_rate', 'org_ceil', 'org_sent']
                }),

                /*
                legend: {
                    position: 'right'
                },
                */
               axes: [
                   /*
                   {
                    type: 'Numeric',
                    position: 'bottom',
                    fields: ['ceil'],
                    label: {
                        //renderer: Ext.util.Format.numberRenderer('0,0')
                        display : 'under',
                        //field   : 'org_rate',
                        minMargin: max ,
                        renderer: function(v){
                            //console.log(v, get_store_max_record('chart_' + id, 'org_ceil'), this.minMargin);
                            if( v >= this.minMargin )
                            return get_store_max_record('chart_' + id );
                            return '';
                        }
                    },
                    grid: false,
                    title: false,
                    dashSize: 3,
                    minimum: 0,
                    max : max,
                    //listeners: {
                    //    onCreateLabel : function(storeItem, item, i, display){
                    //        console.log( storeItem, item);
                    //        return item[0];
                    //    }
                    //},
                    //onPlaceLabel: function(label, storeItem, item, i, display, animate){
                    //    var retVal = this.callParent(arguments);
                    //    console.log( retVal, 'r' );
                    //    if(label.kpiRenderer){
                    //        label.setAttributes({
                    //            text: label.kpiRenderer(storeItem.get(label.field), storeItem),
                    //            y: parseInt(label.attr.y) - 10 //Put a 10px offset on the top of the line marker
                    //        }, true);
                    //        label.show(true);
                    //    }
                    //    return retVal;
                    //}
                },
                */
               /*
                {
                    type: 'Numeric',
                    position: 'top',
                    fields: ['rate'],
                    label: {
                        display : 'under',
                        minMargin: max ,
                        renderer: function(v, self){
                            if( v >= this.minMargin)
                            return get_store_max_record('chart_' + id, 1);
                            return '';
                        }
                    },
                    grid: false,
                    title: false,
                    dashSize: 3,
                    minimum: 0,
                    maximum : max,
                    //listeners: {
                    //    onCreateLabel : function(storeItem, item, i, display){
                    //        return i;
                    //    }
                    //}
                },
                */
                {
                    type: 'Category',
                    position: 'left',
                    fields: ['link'],
                    title: false
                    }
                    ],
                    series: [{
                        type: 'bar',
                        axis: 'bottom',
                        highlight: true,
                        stacked: true,
                        xField: 'link',
                        yField: ['sent', 'rate', 'ceil'],
                        gutter: 50,
                        tips: {
                            trackMouse: true,
                            //width: 140,
                            //height: 28,
                            renderer: function(storeItem, item) {
                                //this.setTitle(storeItem.get('name') + ': ' + storeItem.get('data') + ' views');
                                //this.setTitle(item.yField + ':' + get_unit(storeItem.get('' + item.yField ) )  );
                                //this.setTitle(item.yField + ':' + get_unit(storeItem.get('org_' + item.yField ) )  );
                                this.update(item.yField + ':' + get_unit(storeItem.get('org_' + item.yField ) )  );
                            }
                        }
                        /*,
                        label: {
                            display: 'insideEnd',
                            field: 'data',
                            renderer: Ext.util.Format.numberRenderer('0'),
                            orientation: 'horizontal',
                            color: '#333',
                            'text-anchor': 'middle'
                        }
                        */
                    }]
                });
                storeId[id] = bar;
            }
        else{
            bar = storeId[id];
        }
        bar.store.loadData(data);
        bar.refresh();
        Ext.Function.defer(function(){
            var f = Ext.create('Ext.form.FieldContainer',{
            items:[bar]
            }), fly = (Ext.fly(id));
            if( fly ){
                f.render(fly.dom);
                bar.refresh();
            }
        }, 1000, this, ['', id, r]);
        return '<div id="' + id + '" /></div>';
        //return id + '<div id="' + id + '" /></div>';
        //redraw could re-render height
    }
    
    
    var get_user_info = function(record, columns){
        var rec = [];
        columns = columns || ['host', 'os_name', 'uptime', 'ipv4', 'mac'];
        for (var j = 0, l = columns.length; j < l; j++){
            value = columns[j];
            var display = record ? record.get(value) : '';
            if( 'uptime' == value ){
                display = set_timeToGmt(display);
            }
            rec.push({
                xtype      : 'textfield',
                readOnly   : true,
                fieldLabel : value,
                labelWidth : length.name,
                width      : length.width,
                name       : value,
                value      : display
            });
        }
        var image = {};
        if( showImg ){
            var os_image = os_name_icon_mapping[record.get('os_name').toString().toLowerCase()];
            var src = Ext.String.format( "images/platform/{0}{1}", os_image, img_extension);
            image = Ext.create('Ext.Img',{
                src: src,
                width : length.image_width
            });
        }
        var user_info = Ext.create( 'Ext.form.FieldContainer' , {
            width : length.user_info,
            layout : 'hbox',
            items :[image,{
                xtype: 'container',
                layout: 'auto',
                padding : '0 0 0 50',
                items: rec
            }]
        });
        return user_info;
    }

    var get_all_info_detail = function(){

        var data = {}, count = [] ;
        //var donut = true,
        chart = Ext.create('Ext.chart.Chart', {
            width : (length.window_width - length.grid_qos_width) * 0.7,
            minWidth : (length.window_width - length.grid_qos_width) * 0.7,
            height: length.chart_pie_height,
            //minHeight: length.chart_pie_height,
            //width : 600,
            //height: 600,
            //autoSize: true,
            //flex: 1,
            id: 'chart_all_qos',
            animate: true,
            angleField: 'value',
            lengthField: 'value',
            highlight: {
                segment: {
                    margin: 20
                }
            },
            //store: store_qos,
            store: Ext.create('Ext.data.JsonStore', {
                fields: ['name', 'value']
            }),
            shadow: true,
            legend: {
                position: 'right'
            },
            //insetPadding: 60,
            theme: 'Base:gradients',
            series: [{
                type: 'pie',
                field: 'value',
                //show small
                //showInLegend: true,
                donut: length.donut,
                tips: {
                    trackMouse: true,
                    //width: 150,
                    //height: 50,
                    renderer: function(storeItem, item) {
                        //calculate percentage.
                        var total = 0;
                        for (var j = 0, l = chart.store.data.items.length; j < l; j++){
                            rec = chart.store.data.items[j];
                            total += rec.get('value');
                        }
                        var html = ('Category name : ' + storeItem.get('name') + '<br/>Usage: ' + Math.round(storeItem.get('value') / total * 100) + '%<br/>Total Flow: '+ get_unit( storeItem.get('value') ) + '<br />' );
						this.update( html );
                    }
                },
                highlight: {
                    segment: {
                        margin: 20
                    }
                },
                label: {
                    field: 'name',
                    display: 'outside',
                    contrast: true,
                    minMargin: 10,
                    font: '14px Arial'
                }
            }]
        });
        var qos_priority = Ext.create('Ext.ux.form.MultiSelect', {
            //anchor: '100%',
            xtype: 'multiselect',
            //flex: 1,
            msgTarget: 'side',
            name: 'multiselect',
            allowBlank: false,
            store: [[0,1]],
            //hidden   : true,
            //disabled : true,

            //miner radio height
            height: length.chart_pie_height - 120,
            minHeight: length.chart_pie_height - 120,
            ddReorder: true
        });
        all_info_detail = Ext.create( 'Ext.form.FieldContainer' , {
            width : length.window_width - length.grid_qos_width,
            height: length.chart_pie_height - 60,
            minHeight: length.chart_pie_height - 60,
            id    : 'all_info_detail',
            layout: {
                type: 'hbox',
                pack:"start",
                align: 'stretch'
            },
            items :[chart,{
                xtype: 'container',
                //layout: 'auto',
                items: [{
                    xtype: 'radiogroup',
                    //hidden : true,
                    columns: 1,
                    items:[
                        { 
                            boxLabel: 'intelligent qos'
                            ,inputValue: 0, name: 'qos_priority'
                            ,handler : function ( me, checked ){
                                qos_priority.setDisabled( checked );
                            }
                        },{ 
                            boxLabel: 'custom prioritizing'
                            ,inputValue: 1, name: 'qos_priority'
                            ,handler : function ( me, checked ){
                                qos_priority.setDisabled( !checked );
                            }
                        }
                    ]
                },qos_priority]
            }
            ],
            listeners: {
                afterrender: function(self){
                    //redraw
                    store_app_cat.load({
                        params  : { 
                            'action' : 'get_all_cat' 
                        },
                        callback: function(records){
                            if( isGenerate ){
                                records = get_generate_data(3);
                            }
                            if( 0 == qos_priority_data.length || !store_app_cat_array[0])
                            {
                                /*
                                for (var j = 0, l = store_app_cat.data.items.length; j < l; j++){
                                    record = store_app_cat.data.items[j];
                                    qos_priority_data.push([record.get('id'), record.get('name')])
                                    store_app_cat_array[record.get('id')] = record.get('name');
                                }
                                */
                                for (var j = 0, l = records.length; j < l; j++){
                                    record = records[j];
                                    console.log(record, 'in first initialized cat');
                                    qos_priority_data.push([record.get('id'), record.get('name')])
                                    store_app_cat_array[record.get('id')] = record.get('name');
                                }
                                //default
                                store_app_cat_array[0] = 'NaN';
                            }
                            qos_priority.bindStore(qos_priority_data);
                            //qos_priority.doAutoRender();
                            store_app.load({
                                params  : { 
                                    'action' : 'get_all_app' 
                                },
                                callback: function(records){
                                    if( records ){
                                        for (var j = 0, l = records.length; j < l; j++){
                                            record = records[j];
                                            var cat_id = record.get('cat_id');
                                            if(! (cat_id in data) ){
                                                data[cat_id] = 1;
                                            }
                                            else{
                                                data[cat_id]++;
                                            }
                                        }

                                        for( var i in data ){
                                            count.push({name: store_app_cat_array[i] , value: data[i] });
                                        }
                                        chart.store.loadData(count);
                                        chart.refresh();
                                    }
                                }
                            });
                        }
                    });
                }
            }
        });
    }
    get_all_info_detail();

    var get_user_info_detail = function(record){
        var rec = [];
        var columns = columns || ['host', 'os_name', 'uptime', 'ipv4', 'weight', 'upload', 'device_profile', 'device_priority', 'schedule', 'download', 'mac'];
        for (var j = 0, l = columns.length; j < l; j++){
            value = columns[j];
            var display = record ? record.get(value) : '';
            if( 'uptime' == value ){
                display = set_timeToGmt(display);
            }
            if( 'upload' == value || 'download' == value ){
                display = parseInt(display, 10) || 0;
            }
            rec.push({
                xtype      : 'textfield',
                formItemCls: 'text-border',
                fieldCls   : 'text-transparent',
                readOnly   : true,
                fieldLabel : value,
                labelWidth : length.name,
                width      : length.description,
                name       : value,
                value      : display,
                colspan    : 1
            });
        }
        form_user_info_detail.add( rec );
        //form_user_info_detail = Ext.create('Ext.form.Panel', {
        //    width : length.window_width - length.grid_qos_width,
        //    bodyStyle: style.basic,
        //    hidden : true,
        //    layout : {
        //        type: 'table',
        //        columns: 3
        //    },
        //    items :rec
        //});
    }
    get_user_info_detail(store.getAt(0));
    var set_bar_store = function(r){
        var data = [];
        var link = ['down', 'up'];
        var max  = 0;
        for(var i in link){
            var link_type = link[i];
            var gitter = 0.25;
            sent = r.get(link_type+'_rate'),
            rate = r.get(link_type+'_cfg_rate'),
            ceil = r.get(link_type+'_cfg_ceil');
            total = ceil;
            if( sent <= rate* 0.5 ){
                rate = ceil = 0;
            }
            else if( sent > rate* 0.5 && sent < rate){
                rate = sent;
                sent = ceil = 0;
            }
            else{
                ceil = sent;
                rate = sent = 0;
                //total = sent;
            }
            sent = length.chart_width * sent / total;
            rate = length.chart_width * rate / total;
            ceil = Math.max(length.chart_width - sent - rate, 0);
            /*
            //total = sent + rate + ceil;
            total = ceil;
            if( total < sent || total < rate ){
                total = sent + rate + ceil;
            }
            if( sent < rate ){
                rate = Math.max( rate - sent, 0); 
            }
            else if( sent > rate && sent < ceil ){
                rate = 0;
                //total = sent + ceil;
            }
            else{
                rate = 0;
                ceil = 0;
                //total = sent;
            }
          
            sent = length.chart_width * sent / total;
            rate = length.chart_width * rate / total;
            ceil = Math.max(length.chart_width - sent - rate, 0);
            */
            data.push({
                link: link_type,
                sent: sent,
                rate: rate,
                ceil: ceil,
                org_sent: r.get(link_type+'_rate'),
                org_rate: r.get(link_type+'_cfg_rate'),
                org_ceil: r.get(link_type+'_cfg_ceil')
            });
        }
        return data;
    }
         
    var set_user_info = function(){
        var user_infos = [];
        var enable_controls = [];
        var enable_controls_data = [];
        var container_user_infos_data = [];

        //parental
        enable_controls_data.push([
            {name : 'block all socail network', value: 0},
            {name : 'block facebook'          , value: 1},
            {name : 'block skype'             , value: 2}
        ]);
        //schedule
        var tmp = [];
        for(var index in schedule_mapping){
            tmp.push({name : schedule_mapping[index]           , value: index});
        }
        enable_controls_data.push(tmp);

        for (var j = 0, l = store.data.items.length; j < l; j++){
            record = store.data.items[j];
            //one user 
            var user_info = get_user_info(record);
            enable_controls = [];
            var uid = record.get('uid');

            Ext.each(['parental', 'schedule'], function(value, index){
                enable_controls.push({
                    xtype    : 'fieldcontainer', 
                    //width    : length.container,
                    defaults : {
                        labelWidth : length.labelwidth,
                        width      : length.width 
                    },
                    layout : {
                        type  : 'hbox',
                        align : 'left'
                    },
                    items  : [{
                        xtype : 'checkboxgroup',
                        name       : '&nbsp;',
                        defaults :{
                            inputValue: '1',
                            uncheckedValue  : '0',
                        },			
                        items:[
                            { boxLabel:'enable '+value + ' control'   , name: 'box_enable_' + uid ,
                            handler: function(self, checked){}}
                        ]
                        },{
                            xtype: 'combo',
                            width: length.width,
                            store: Ext.create('Ext.data.Store', {
                                fields : ['name', 'value'],
                                data   : enable_controls_data[index],
                        }),
                        displayField : 'name',
                        valueField   : 'value',
                        editable     : false,
                        //fieldLabel   : 'enable '+value + ' control',
                        name         :  'combo_' + uid
                    }
                ]
            });
        });

        var container_user_info = Ext.create( 'Ext.form.FieldContainer' , {
            layout : 'hbox',
            width  : length.window_width - length.width,
            margin: 5,
            padding:15,
            bodyPadding: 10,
            border: 1,
            style: {
                borderColor:'#000000', 
                borderStyle:'solid', 
                borderWidth:'1px'
            },
            items :[
                user_info, 
                {
                    xtype    : 'fieldcontainer', 
                    width    : length.container,
                    defaults : {
                        //labelWidth : length.labelwidth,
                        width      : length.enable_controls
                    },
                    layout : {
                        type  : 'auto',
                        align : 'left'
                    },
                    items  : enable_controls
                }]
            }); 
            container_user_infos_data.push( container_user_info );
        }

        var container_user_infos = Ext.create( 'Ext.form.FieldContainer' , {
            layout : 'auto',
            width  : length.window_width,
            items  : container_user_infos_data
        });
        Ext.getCmp('parental_control').add(container_user_infos);
    }
    var drawTopology = function( ){
        var mydia = Joint.dia.mydia = {};
        var tspan_width = 200, tspan_height = 100;
        var org = Joint.dia.org;
        var filter = [-1];

        //root in center
        var rec  = store.findRecord('uid', -1);
        //left bottom [x,y] position
        chartXY = topology_chart.getPosition();
        console.log( chartXY ,length.window_width/2 - chartXY[0] ,chartXY[1] - length.window_height + tspan_height);
        var os_image = os_name_icon_mapping[rec.get('os_name').toString().toLowerCase()];
        var avatar_alert = rec.get('device_priority') || 5;
        var Member = {
            rect: { 
                x: chartXY[0] + tspan_width ,
                //x: length.window_width/2 - chartXY[0] ,
                //y: chartXY[1] - length.window_height + tspan_height,
                y: 0 + tspan_height * 2,
                width: tspan_width - 50, 
                height: tspan_height - 50 
            },
            position: "home network",
            attrs: {
                stroke: 'gray' 
            },
            _opt:{
                draggable: true
            }
        };
            Member['avatar'] =  'images/platform/icon/'+os_image+img_extension
        if( showImg ){
            Member['avatar'] =  'images/platform/icon/'+os_image+img_extension
        }
        var root = org.Member.create(Member);

        
        for (var j = 0, l = store.data.items.length; j < l; j++){
            rec = store.data.items[j];
            var uid = rec.get('uid');
            if( -1 == filter.indexOf(uid)){
                filter.push( uid);
                os_image = os_name_icon_mapping[rec.get('os_name').toString().toLowerCase()];
                divition = 4;
                var x =  y =0,unit_x = length.window_width / divition,
                    unit_y= length.window_height/ divition;
                
                //divition*divition space
                //sqrt for not show inner
                var sqrt = Math.floor( Math.sqrt(divition));
                var tmp_index = j;
                if( j + sqrt < Math.pow(divition,2 )){
                    if( j > divition && j < divition *2)
                    {
                        j += sqrt;
                    }
                    else if( j >= divition *2 ){
                        j += sqrt * 2;
                    }
                    var quotient = Math.floor (j / divition),
                    remainder = j % divition;
                    x = unit_x * remainder;
                    y = unit_y * quotient;
                }
                j = tmp_index;
                avatar_alert = rec.get('device_priority') || 1;
                Member = {
                    rect: { 
                        x: x,
                        y: y, 
                        width: tspan_width, 
                        height: tspan_height 
                    },
                    platform: "Uptime: "    + set_timeToGmt(rec.get('uptime')),
                    name: "platform: "      + rec.get('os_name'),
                    position: "host: "      + rec.get('ipv4'),
                    ti:"Traffic Indicator: ",// + index + "|x=" + x+"|y="+y,
                    avatar_alert: 'images/toolbar/alert'+avatar_alert+img_extension,
                    avatar_alert_width: avatar_alert,
                    attrs: {
                        fill: '#e4d8a4', 
                        stroke: 'gray' 
                    },
                    _opt:{
                        draggable: false
                    }
                };
                Member['avatar'] =  'images/platform/icon/'+os_image+img_extension
                if( showImg ){
                    Member['avatar'] = 'images/platform/icon/'+os_image+img_extension;
                }
                var bart = org.Member.create(Member);
                root.joint(bart, org.arrow);
            }
        }
    }
    var grid_qos_user_info = function(record){
        var os_image = '';
        var div = '<div style="width:100%">';
        var totalApp = 0;
        if( showImg ){
        var os_image = os_name_icon_mapping[record.get('os_name').toString().toLowerCase()];
            div     +='<div style="position:relative;float:left;width:50%"><image width="120px"src="images/platform/{0}'+img_extension+'"/></div>';
        }
        else{
            os_image = record.get('os_name').toString().toLowerCase();
            div     +='<div style="position:relative;float:left;width:50%;word-wrap:break-word;overflow:hidden;">os:<br /> {0}</div>';
        }
        div     +='<div style="position:relative;float:right;width:50%;word-wrap:break-word;overflow:hidden;">os_vendor: {1}<br/>host: {2}<br/>ip: {3}<br />mac: {4}<br />total app: {5}</div>';
        div     +='</div>';

        //already filtered
        if( -1 == record.get('uid') ){
            Totalapp = get_aggrigate_app('all');
            console.log('Totalapp:', Totalapp, ', store_app:', store_app, individual_totalapp);
        }
        else{
            Totalapp = get_aggrigate_app(record.get('mac'));
        }
        //end

        return Ext.String.format( div, os_image,record.get('os_vendor'), record.get('host'), record.get('ipv4'), record.get('mac'), Totalapp) ;
    }

    //main grid
    var grid_qos = Ext.create('Ext.grid.Panel', {
        cls: 'custom-first-last', 
        frameHeader : false,
        hideHeaders : true,
        overlapHeader : true,
        store: store,
        height: length.window_height - 40,
        width:  length.grid_qos_width,
        forceFit: true,
        columns: [{
            frame: true, tdCls: 'x-bubble-corner',dataIndex: 'host',renderer: function(value, metaData, record, row, col, store, gridView){
                return grid_qos_user_info(record) ;
            }
        }
        ],
        listeners: {
            itemclick: function( grid, record, item, index, e, eOpts ){
                var isAll = 0;
                current_user = record;
                if( -1 == record.get('uid') ){
                    isAll = true;
                }
                else{
                    isAll = false;
                }
                //initialized
                toggle_to_all(isAll);
            },
            afterrender: function(self){
            }
        }
    });

    var grid_qos_app_detail = Ext.create('Ext.ux.LiveSearchGridPanel', {
        store: store_app,
        cls: 'grid_qos_app_detail',
        width : length.window_width - length.grid_qos_width - 50,
        forceFit: true,
        allowDeselect : true,
        autoScroll: true,
        manageHeight: false,
        //maxHeight: length.window_height,
        //minHeight: length.window_height,
        //minHeight: length.grid_qos_height,
        //maxHeight: length.grid_qos_height,
        columns: [{
            width:(length.window_width - length.grid_qos_width - 50)* 0.2 , text: 'application', dataIndex: 'app',menuDisabled:true, renderer: function(value, metaData, record, row, col, store, gridView){
                var app_icon = record.get('app_name').toLowerCase() || 'general';
                var div      = get_row_template(1,1);
                var text     = 'id=' + Ext.String.format( '{0}_{1}_{2}', record.get('mac').replace(/:/g, '_'), record.get('cat_id'), record.get('app_id'))
                + '<br />cat_id=' + record.get('cat_id')
                + '<br />app_id=' + record.get('app_id') 
                + '<br />order_no=' + record.internalId + '<br />';
                return text + Ext.String.format( div, app_icon, value, grid_column_height_padding, record.get('mac'));
            }
        },{
            width:(length.window_width - length.grid_qos_width - 50)* 0.1 , text: 'quality', dataIndex: 'app_quality',menuDisabled:true, renderer: function(value, metaData, record, row, col, store, gridView){
                var id       = record.get('mac').replace(/:/g, '_');
                var div      = get_row_template(1,2);
                var quality  = get_app_quality(record);
                return Ext.String.format( div, id, record.get('cat_id'), record.get('app_id'), quality);
            }
        },
        {
            width:(length.window_width - length.grid_qos_width - 50)* 0.7 , text: 'bandwidth', dataIndex: 'bandwidth',menuDisabled:true, renderer: render_app_to_grid
        }
        ],
        verticalScroller: {
            trailingBufferZone: 10,  // Keep 200 records buffered in memory behind scroll
            leadingBufferZone: 50   // Keep 5000 records buffered in memory ahead of scroll
        },
        dockedItems: [
            paging,
            {
					xtype : 'button',
                    dock  : 'top',
                    id    : 'pause',
					text  : 'pause' ,
					handler: function (self) {
						if ( self.text == 'pause' ){
							if (intervalid.app_qos){
                                clearInterval(intervalid.app_qos);
								//me.intervalId = undefined;
							}
							self.setText( 'resume' );

						}else
						if( self.text == 'resume' ){
                            intervalid.app_qos= setInterval( get_store_app_flow_interval, refresh_rate );
							//me.intervalId = setInterval( refreshStore , me.intervalValue*1000  );
							self.setText( 'pause' );
						}
					}
				}],
                listeners : {
                    afterrender: function(grid, record){
                        var view = grid.getView();
                        var el = view.getEl();
                        this.mon(el,'scroll', function(){
                            var scrollTop = (grid_qos_app_detail.getView().el.dom.scrollTop);
                            var scrollHeight = (grid_qos_app_detail.getView().el.dom.scrollHeight);
                            var scrollWithbar= length.window_height - paging.getHeight()*2;
                            var startResize = scrollHeight / 4;
                            if( grid_qos_app_detail.getHeight() == scrollWithbar){
                                if( 0 == scrollTop ){
                                    console.log(scrollTop, scrollHeight, scrollHeight / 4);
                                    all_info_detail.setVisible(true);
                                    grid_qos_app_detail.setHeight(length.window_height-(all_info_detail.getHeight())-paging.getHeight()*2);
                                }
                            }
                            else{
                                if( scrollTop > startResize){
                                    console.log('in large, ', scrollTop, scrollHeight, scrollHeight / 4);
                                    all_info_detail.setVisible(false);
                                    grid_qos_app_detail.setHeight(scrollWithbar);
                                }
                                
                            }
                        },this);
                        grid.body.mask('Loading...');
                        toggle_to_all(true);
                    }
            }
    });
    grid_qos_app_detail.down('.headercontainer').on('sortchange', function(ct, column, direction, eOpts) {
        //app app_quality bandwidth
        var field = 'app_name';
        var large = 1, small = -1;
        if( 'DESC' == direction ){
            large = -1;
            small = 1;
        }
        
        //console.log('hi',ct, column, direction, eOpts);
        grid_qos_app_detail.store.sort([
            {
                sorterFn: function(o1, o2){
                    if('app_quality' == column.dataIndex){
                        return get_app_quality(o1) > get_app_quality(o2) ? large : small;
                    }
                    else if( 'app' == column.dataIndex ){
                        return o1.get('app_name') > o2.get('app_name') ? large : small;
                    }
                    else if( 'bandwidth' == column.dataIndex ){
                        return o1.get('down_cfg_ceil') > o2.get('down_cfg_ceil') ? large : small;
                    }
                }
            }
        ]);
    });
    
    var topology_chart = Ext.create('Ext.panel.Panel',{
        id : 'network',
        title: 'my network',
        listeners: {
            afterrender : function(self){
                Joint.paper(self.id + '-body', length.window_width, length.window_height);  
               drawTopology();
           }
       }
   });

   var parental = Ext.create('Ext.form.Panel', {
       title: 'Parental Control',
       id   : 'parental_control',
       autoScroll: true,
       bodyPadding: 5,
       width  : length.window_width,

       layout: 'anchor',
       defaults: {
           anchor: '100%'
       },

       items: [],
       buttons: [{
           text: 'Reset',
           handler: function() {
               this.up('form').getForm().reset();
           }
       }, {
           text: 'Submit',
           formBind: true, //only enabled once the form is valid
           disabled: true,
           handler: function() {
               var form = this.up('form').getForm();
               if (form.isValid()) {
                   form.submit({
                       success: function(form, action) {
                           Ext.Msg.alert('Success', action.result.msg);
                       },
                       failure: function(form, action) {
                           Ext.Msg.alert('Failed', action.result.msg);
                       }
                   });
               }
           }
       }]
   });
   var container_qos_user_info_detail = Ext.create( 'Ext.form.FieldContainer' , {
       width : length.container - length.grid_qos_width,
       id    : 'container_qos_user_info_detail',
       layout : 'auto',
       items :[form_user_info_detail, all_info_detail, grid_qos_app_detail
       //items :[form_user_info_detail, grid_qos_app_detail, all_info_detail
       //, grid_qos_all_app_detail
   ]
   });
   //form_user_info_detail.setVisible(false), grid_qos_app_detail.setVisible(false);
   //var container_qos_all_info_detail = Ext.create( 'Ext.form.FieldContainer' , {
   //    width : length.container - length.grid_qos_width,
   //    layout : 'auto',
   //    hidden : false,
   //    items :[all_info_detail, grid_qos_all_app_detail ]
   //});
   var container_qos = Ext.create( 'Ext.form.FieldContainer' , {
       title : 'Qos',
       width : length.container,
       layout : 'hbox',
       //not toggle
       items :[grid_qos, container_qos_user_info_detail]
   });
   var Tab = Ext.create('Ext.tab.Panel', {
       plain : true,
       renderTo: 'login_bg',
       bodyStyle: style.basic,
       style : style.basic,
       border: 0,
       width : length.window_width,
       height: length.window_height,
       activeTab: 0,
       items: [
           container_qos,
           parental,
           topology_chart
       ]
   });

   //------------------initial
   store.load({
       callback: function(records){
           if( isGenerate ){
               records = get_generate_data();
           }
           if( records.length <= 1 ){ 
               Tab.setLoading( 'Loading...' );
           }
           else{
               //Ext.getBody().mask( false );
               Tab.setLoading( false );
           }
           var general_user = [];
           var noduplicatrec = [];
           if( form_user_info_detail ){
               form_user_info_detail.loadRecord(records); //initial load
           }

           for (var j = 0, l = records.length; j < l; j++){
               rec = records[j];
               if( rec.get('mac') ){
                   noduplicatrec.push( rec );
               }
               /*
               if( ghost == rec.get('ipv4') || '' == rec.get('ipv4')){
                   general_user.push(rec);
               }
               else{
                   noduplicatrec.push( rec );
               }
               */
           }
           noduplicatrec.splice(0, 0,
           {
               uid:-1,
               host: 'all',
               os_name: 'all',
               uptime: 200,
               ipv4: '',
               weight:0,
               upload:520000,
               device_profile:1,
               schedule:0,
               download:12000000,
               device_priority:0
           });
           //noduplicatrec.push(general_user[0]);
           store.loadData(noduplicatrec);
           set_user_info();
       }
   });

   if( -1 != intervalid.grid_qos ){
       clearInterval(intervalid.grid_qos);
   }
   if( -1 != intervalid.grid_qos_all_app_detail){
       clearInterval(intervalid.grid_qos_all_app_detail);
   }
   if( -1 != intervalid.grid_qos_app_detail){
       clearInterval(intervalid.grid_qos_app_detail);
   }
   function fireItemclick(){
       if( !current_user )
       {
           current_user = Ext.create('model_user_info', { uid:i, host: 'all', os_name: 'all', uptime: set_timeToGmt(new Date().getTime()/1000), ipv4: i, weight:0, upload:520000, device_profile:1, schedule:0, download:12000000, device_priority:0 });
       }
       grid_qos.fireEvent('itemclick', grid_qos_user_info, current_user );
   }
   if( refresh_all_rate_enable ){
   intervalid.grid_qos= setInterval( function(){(current_user = grid_qos.getSelectionModel().getSelection()[0]);store.load()}, refresh_all_rate );
   intervalid.grid_qos_all_app_detail = setInterval( fireItemclick, refresh_all_rate );
   intervalid.grid_qos_app_detail = setInterval( fireItemclick, refresh_all_rate );
   }
 })
