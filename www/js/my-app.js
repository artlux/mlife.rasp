// Initialize your app
//device.uuid
window.reloadPageInJs = false;

window.debug = false;
window.startUrl = 'http://mlife.by/ajax/rasp_app/';

window.deviceId = '';

window.initCustomJs = false;

window.onPageGenerate = false;
window.connection = false;

window.reload = false;

//version
var version = localStorage.getItem('version');
if(!version) version = '1.0.0';

// Export selectors engine
var $$ = Dom7;
//templates
var tmpl = false;

//таймаут получения контента
var loadCnt = false;

var loadVersion = false;

//текущая страница
var curentPage = false;

var pullToRefresh = false;

var startPageContent = function(content){
	if(content) content = content.replace("link.html?page=","");
	if(!content) content = 'main';
	//setTimeout(function(){
	getPage(content);
	//},500);
};

//sql
document.addEventListener("deviceready",onRd,false);

document.addEventListener("backbutton", function(){
	if(typeof window.backButtonHandler == 'function'){
		return window.backButtonHandler();
	}else{
		$$("a.backlink").click();
		return false;
	}
}, false);

var db = false;
function onRd(){

window.myApp = new Framework7({
	modalButtonOk: 'Подвердить',
	modalButtonCancel: 'Отменить',
	swipeBackPage: false,
	sortable: false,
	swipeout: false,
	swipePanel: false,
	router: false,
	cache: false,
	dynamicPageUrl: 'content-{{name}}',
	preroute: function (view, options) {
		
    }
});

// Add view
window.mainView = window.myApp.addView('.view-main',{
  dynamicNavbar: false,
  //reloadPages: true
});

window.myApp.onPageInit('*', function (page) {
//console.log(page);
if(typeof window.initPageLoadCallback == 'function'){
	window.initPageLoadCallback(page);
	window.myApp.hidePreloader();
}
return;
});

if(typeof device != 'undefined') {
	window.deviceId = device.uuid;
}else{
	function makeid(){
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for( var i=0; i < 12; i++ )
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		return text;
	}
	window.deviceId = localStorage.getItem('device_id');
	if(!window.deviceId) {
		window.deviceId = makeid();
		localStorage.setItem('device_id',window.deviceId);
	}
}

var timer = setTimeout(function t(){
	if(!loadCnt) {
		setTimeout(t,100);
	}else{
		content = loadCnt;
		loadCnt = false;
		if(!pullToRefresh){
		content = '<div class="page" data-page="main"><div class="page-content">'+content+'</div></div>';
		}else{
		pullToRefresh = false;
		content = '<div class="page" data-page="main"><div class="page-content pull-to-refresh-content"><div class="pull-to-refresh-layer"><div class="preloader"></div><div class="pull-to-refresh-arrow"></div></div>'+content+'</div></div>';
		}
		
		window.mainView.router.load({
		  content: content,
		  animatePages: false,
		  reload: window.reload
		});
		window.myApp.hidePreloader();
		
		//window.reload = false;
		loadJs();
		loadMenu();
		loadCss();
		//refreshBook();
	}
},100);

if(typeof(window.openDatabase) !== 'undefined'){
	db = window.openDatabase('mliferasp.db','1.0','mliferasp',1*1024*1024);
}else{
	db = window.sqlitePlugin.openDatabase({name: 'mliferasp',location: 'default'},function(db){});
}
db.transaction(function(tx){
tx.executeSql("CREATE TABLE IF NOT EXISTS pages (ID VARCHAR PRIMARY KEY, type VARCHAR, text TEXT)",[]);
tx.executeSql("CREATE TABLE IF NOT EXISTS block (ID VARCHAR PRIMARY KEY, text TEXT)",[]);
tx.executeSql("CREATE TABLE IF NOT EXISTS tmpl (ID VARCHAR PRIMARY KEY, text TEXT)",[]);
tx.executeSql("CREATE TABLE IF NOT EXISTS book (ID VARCHAR PRIMARY KEY, text TEXT)",[]);
},function(){
},function(){
	checkConnection();
	setTmpl();
	startPageContent();
});



}

function checkConnection() {
	if(typeof navigator.connection != 'undefined'){
	
	var Connection = {
		UNKNOWN: "unknown",
        ETHERNET: "ethernet",
        WIFI: "wifi",
        CELL_2G: "2g",
        CELL_3G: "3g",
        CELL_4G: "4g",
        CELL:"cellular",
        NONE: "none"
	};
	var networkState = navigator.connection.type;
    var states = {};
    states[Connection.UNKNOWN]  = true;
    states[Connection.ETHERNET] = true;
    states[Connection.WIFI]     = true;
    states[Connection.CELL_2G]  = true;
    states[Connection.CELL_3G]  = true;
    states[Connection.CELL_4G]  = true;
    states[Connection.CELL]     = true;
    states[Connection.NONE]     = false;

    if(states[networkState]===true) {
		window.connection = states[networkState];
	}else if(states[networkState]===false){
		window.connection = states[networkState];
	}else{
		window.connection = true;
	}
	}else{
	window.connection = true;
	}
	
}

function setTmpl(){
	db.transaction(function(tx){
	tx.executeSql("SELECT * FROM tmpl WHERE ID!=0",[],function(t,res){
	tmpl = {};
	if(res.rows.length > 0){
		for(var i=0;i<res.rows.length;i++){
			tmpl[res.rows.item(i)['ID']] = res.rows.item(i)['text'];
		}
	}
	},
	function(tx,err){
	tmpl = {};
	}
	);
	});
}
function getTmpl(id){
	if(!tmpl[id]) return "";
	return tmpl[id];
}

//таймаут обновлений
var loader = false;

function getPage(page){
	window.myApp.showPreloader("Загрузка страницы");
	checkConnection();
	
	if(typeof window.getPageHandler == 'function'){
		page = window.getPageHandler(page);
	}
	
	curentPage = page;
	var content='';
	
	//window.reload = false;
	
	if(page=='main'){
	//window.reload = true;
	loadVersion = false;
	checkVersion();
	
	var timer = setTimeout(function t(){
	if(!loadVersion) {
		setTimeout(t,300);
	}else{
		
		var last = getVersion();
		if(last != version) page = 'main_old';
		if(!window.connection) page = 'main_offline';
		lpage(page);
		
	}
	},300);
	
	
	}else{
		if(typeof window.beforeLoadPage == 'function'){
			if(!window.beforeLoadPage(page)) lpage(page);
		}else{
			lpage(page);
		}
		
	}
	
	function lpage(page){
	db.transaction(function(tx){
	tx.executeSql("SELECT * FROM pages WHERE ID=?",[page],function(t,res){
	if(res.rows.length > 0){
		var tmp = getTmpl(res.rows.item(0)['type']);
		if(!tmp){
			loadCnt = '<p class="errorPage">ERROR load page '+page+'</p><p>Шаблон не найден, возможно произошла ошибка при загрузке данных. Проверьте соединение с интернетом и повторите загрузку.</p><p><a href="#" id="loadBase" class="button active">Загрузить данные</a></p>';
		}else{
			if (window.debug) console.log('startpage - '+page);
			if(window.onPageGenerate !== false) {
				var loadCntTemp = window.onPageGenerate(page,JSON.parse(res.rows.item(0)['text']),tmp);
				if(loadCntTemp) loadCnt = loadCntTemp;
			}
			if(!loadCnt){
			var compiled = Template7(tmp).compile();
			loadCnt = compiled(JSON.parse(res.rows.item(0)['text']));
			}
		}
	}
	
	if((page == 'main' || page == 'main_old') && !loadCnt){
		content = '' +                  
		'<div class="content-block"> <div class="content-block inset"><div class="content-block-inner">'+
		'<p>Это первый запуск приложения. Дождитесь загрузки данных.</p>'+
		''+
		''+
		'</div>' +
								'</div>'
		'</div>' +
		'';
		loadCnt = content;
		loadBaseDefault();
		
	}else if(!loadCnt) {
		loadCnt = '<p class="errorPage">ERROR load page '+page+'</p>';
		
	}
	},
	function(tx,err){
	loadCnt = '<p class="errorPage">ERROR sql load page '+page+'</p>';
	}
	);
	});
	}

}






$$(document).on('click','a.backlink',function(e){
	e.preventDefault();
	var count = 0;
	var lastHistory = '';
	var prevHistory = '';
	$$.each(window.mainView.history, function (ind, val) {
		count = count +1;
		prevHistory = lastHistory;
		lastHistory = val;
	});
	//console.log(lastHistory);
	if((count > 0) && (prevHistory.indexOf("#content-") !== -1)) {
		if((prevHistory.indexOf("#content-main") === 0) || (lastHistory.indexOf("#content-main") === 0)){
			//window.myApp.openPanel("left");
			$$("#pMain").click();
			return;
		}else{
			window.mainView.router.back();
		}
	}else{
		//window.myApp.openPanel("left");
		$$("#pMain").click();
	}
	return;
});

$$(document).on('click','a',function(e){
	
	if($$(this).hasClass('backlink')) return;
	
	if($$(this).attr('href').indexOf('#') === 0){
		e.preventDefault();
	}
	if($$(this).attr('href').indexOf('link.html') === 0){
	e.preventDefault();
	}
	loadPageForUrl($$(this).attr('href'));
	
	
});

function loadPageForUrl(href){
	if(href.indexOf('link.html') === 0){
		
		
		startPageContent(href);
		
		var timer = setTimeout(function t(){
		if(!loadCnt) {
			setTimeout(t,300);
		}else{
		content = loadCnt;
		loadCnt = false;
		
		if(!pullToRefresh){
		content = '<div class="page" data-page="'+curentPage+'"><div class="page-content">'+content+'</div></div>';
		}else{
		pullToRefresh = false;
		content = '<div class="page" data-page="'+curentPage+'"><div class="page-content pull-to-refresh-content"><div class="pull-to-refresh-layer"><div class="preloader"></div><div class="pull-to-refresh-arrow"></div></div>'+content+'</div></div>';
		}
		if(curentPage == 'main' || curentPage == 'main_old') {
			window.reload = true;
		}
		window.mainView.router.load({
		  content: content,
		  animatePages: false,
		  reload: window.reload,
		  ignoreCache: true
		});
		if(curentPage == 'main' || curentPage == 'main_old') {
			window.reload = false;
		}
		window.myApp.hidePreloader();
			
		}
		},300);
	
	}else{
		return;
	}
}




$$(document).on('click', '.closep', function (e) {
window.myApp.closePanel();
});

function getVersion(){
	var last = localStorage.getItem('last_version');
	if(!last) last = '1.0.0';
	return last;
}

function checkVersion(add){
var last = localStorage.getItem('last_version');
if(!last) last = '1.0.0';
if(last == version){
	//check update;
	if(window.connection){
		
		loadVersion = false;
		
		$$.ajax({
			url : window.startUrl+'version/',
			async : false,
			data : {device:window.deviceId, key: localStorage.getItem('authorize_key')},
			dataType: 'html',
			success : function(data){
				if(data != version) {
					localStorage.setItem('last_version',data);
					loadVersion = true;
				}else{
					loadVersion = true;
				}
			},
			error: function(){
				
			}
		});
		
	}
}
loadVersion = true;

return last;
}

function setLastVersion(add){
	version = checkVersion(add);
	localStorage.setItem('version',version);
}

function loadMenu(){
db.transaction(function(tx){
	tx.executeSql("SELECT * FROM block WHERE ID=?",['menu'],function(t,res){
	if(res.rows.length > 0){
	var menu = res.rows.item(0)['text'];
	$$('#menuBlock').remove();
	$$('.panel-left').append(menu);
	if (window.debug) console.log('menu Loaded');
	
	if(typeof window.initMenuLoadCallback == 'function'){
		window.initMenuLoadCallback();
	}
	
	}
	});
});
}

function loadCss(){
db.transaction(function(tx){
	tx.executeSql("SELECT * FROM block WHERE ID=?",['styles'],function(t,res){
	if(res.rows.length > 0){
	var d = res.rows.item(0)['text'];
	$$('#stylesBlock').html(d);
	}
	});
});
}

function loadJs(){
if (window.debug) console.log('loadJs');
db.transaction(function(tx){
	tx.executeSql("SELECT * FROM block WHERE ID=?",['js'],function(t,res){
	if(res.rows.length > 0){
	var d = res.rows.item(0)['text'];
	$$('#jsBlock').html(d);
	setTimeout(function(){
		if(typeof window.initCustomJs == 'function'){
			window.initCustomJs();
		}else{
		}
	},0);
	}
	});
});
}

$$(document).on('click', '#exit', function () {
	if (navigator && navigator.app) {
         navigator.app.exitApp();
    }else{
        if (navigator && navigator.device) {
            navigator.device.exitApp();
		}
    }
});

$$(document).on('click', '#loadBase',function (e) {
	loadBaseDefault();
});

var pages_arr = [];

function loadBaseDefault(step,step2){
	
	setTimeout(function(){
	if(!step){
	checkConnection();
	if(!window.connection) {
		window.myApp.alert('Нет соединения, загрузка невозможна.','Уведомление');
		return;
	}
	
	$$('#ldTimer').remove();
	$$('.page-content').prepend('<div class="content-block" id="ldTimer" style="margin:5px;"><div class="content-block-inner"><div class="loadpersent" style="border-radius:3px;display:block;width:10%;background:green;height:20px;color:#ffffff;text-align:center;">0%</div></div></div></div>');
	
	//window.myApp.showPreloader('Идет загрузка данных...')
	$$("#loadBase").hide();
	
	/*
	var cntTimer = 0;

	var timer = setTimeout(function t(){
	if(!loader) {
		cntTimer++;
	if(cntTimer>800) loader = true;
		setTimeout(t,300);
	}else{
	$$("#pMain").click();
	//window.myApp.hidePreloader();
	if(loader > 800){
	window.myApp.alert('Произошла ошибка, плохое соединение с интернет. Попробуйте повторить загрузку.','Уведомление');
	}
	}
	},1000);
	*/
	db.transaction(function(tx){
		tx.executeSql("DELETE FROM block WHERE ID>0",[]);
		tx.executeSql("DELETE FROM pages WHERE ID>0",[]);
		tx.executeSql("DELETE FROM tmpl WHERE ID>0",[]);
	},function(){},function(){
		
		loadBaseDefault(2);

	});
	}else if(step==2){
		
		$$.ajax({
			url : window.startUrl+'tmpl/',
			//async : false,
			data : {device:window.deviceId, key: localStorage.getItem('authorize_key')},
			dataType: 'json',
			success : function(data){
				
				$$('#ldTimer .loadpersent').html('5%');
				$$('#ldTimer .loadpersent').css({'width':'10%'});
				
				db.transaction(function(tx){
					$$.each(data, function (index, value) {
						tx.executeSql("INSERT INTO tmpl (ID, text) VALUES (?,?)",[index,value],function(){});
					});
				},function(r){
				},function(){
					setTmpl();
					loadBaseDefault(3);
				});
			},
			error : function(){
				
				$$('#ldTimer .loadpersent').html('Ошибка связи');
				$$('#ldTimer .loadpersent').css({'width': '100%', 'background':'red'});
				$$("#loadBase").show();
				
			}
		});
		
		
		
	}else if(step==3){
		
		$$.ajax({
			url : window.startUrl+'menu/',
			//async : false,
			data : {device:window.deviceId, key: localStorage.getItem('authorize_key')},
			success : function(data){
				if(data) {
					
					$$('#ldTimer .loadpersent').html('10%');
					$$('#ldTimer .loadpersent').css({'width':'10%'});
					
					db.transaction(function(tx){
					tx.executeSql("INSERT INTO block (ID, text) VALUES (?,?)",['menu',data],function(){
					loadMenu();
					loadBaseDefault(4);
					});
					});
				}
			},
			error : function(){
				
				$$('#ldTimer .loadpersent').html('Ошибка связи');
				$$('#ldTimer .loadpersent').css({'width': '100%', 'background':'red'});
				$$("#loadBase").show();
				
			}
		});
		
	}else if (step==4){
		
		$$.ajax({
			url : window.startUrl+'js/',
			//async : false,
			data : {device:window.deviceId, key: localStorage.getItem('authorize_key')},
			success : function(data){
				if(data) {
					
					$$('#ldTimer .loadpersent').html('15%');
					$$('#ldTimer .loadpersent').css({'width':'15%'});
					
					db.transaction(function(tx){
					tx.executeSql("INSERT INTO block (ID, text) VALUES (?,?)",['js',data],function(){
					loadBaseDefault(5);
					});
					});
				}
			},
			error : function(){
				
				$$('#ldTimer .loadpersent').html('Ошибка связи');
				$$('#ldTimer .loadpersent').css({'width': '100%', 'background':'red'});
				$$("#loadBase").show();
				
			}
		});
		
	}else if (step==5){
		
		$$.ajax({
			url : window.startUrl+'css/',
			//async : false,
			data : {device:window.deviceId, key: localStorage.getItem('authorize_key')},
			success : function(data){
				if(data) {
					$$('#ldTimer .loadpersent').html('17%');
					$$('#ldTimer .loadpersent').css({'width':'17%'});
					
					db.transaction(function(tx){
					tx.executeSql("INSERT INTO block (ID, text) VALUES (?,?)",['styles',data],function(){
					loadCss();
					loadBaseDefault(6);
					});
					});
				}
			},
			error : function(){
				
				$$('#ldTimer .loadpersent').html('Ошибка связи');
				$$('#ldTimer .loadpersent').css({'width': '100%', 'background':'red'});
				$$("#loadBase").show();
				
			}
		});
		
	}else if (step==6){
		
		$$.ajax({
			url : window.startUrl+'page/',
			//async : false,
			data : {device:window.deviceId, key: localStorage.getItem('authorize_key')},
			dataType: 'json',
			success : function(data){
				//console.log(data);
				$$('#ldTimer .loadpersent').html('20%');
				$$('#ldTimer .loadpersent').css({'width':'20%'});
				loadPages(false,data);
			},
			error : function(){
				
				$$('#ldTimer .loadpersent').html('Ошибка связи');
				$$('#ldTimer .loadpersent').css({'width': '100%', 'background':'red'});
				$$("#loadBase").show();
				
			}
		});
		
	}
	},150);
	
}

function loadPages(step,data){
	setTimeout(function(){
	if(step === false){
		
		var cnt = 0;
		var pages = '';
		
		pages_arr = [];
		
		$$.each(data, function (index, page) {
			cnt = cnt + 1;
			if(cnt < 15){
				pages += page+",";
			}else{
				pages += page+",";
				pages_arr.push(pages);
				pages = '';
				cnt = 0;
			}
		});
		if(cnt>0) {
			pages_arr.push(pages);
		}
		loadPages(0,next_k);
	}else{
	
		for(k in pages_arr){
			if(step == parseInt(k)){
				var next_k = parseInt(k)+1;
				$$.ajax({
					url : window.startUrl+'getpages/'+pages_arr[k]+'/',
					data : {device:window.deviceId, key: localStorage.getItem('authorize_key')},
					dataType: 'json',
					success : function(dt){
						
						if(next_k != pages_arr.length) {
							var pers = 80/pages_arr.length;
							pers = 20+next_k*pers;
							pers = Math.ceil(pers);
							
							$$('#ldTimer .loadpersent').html(pers+'%');
							$$('#ldTimer .loadpersent').css({'width': pers+'%'});
							
							db.transaction(function(tx){
								$$.each(dt, function (ind, val) {
									tx.executeSql("INSERT INTO pages (ID, type, text) VALUES (?,?,?)",[val['page'],val['type'],JSON.stringify(val['text'])],function(){});
								});
							},function(){},function(){
								loadPages(next_k);
							});
							
							
						}else{
							
							db.transaction(function(tx){
								$$.each(dt, function (ind, val) {
									tx.executeSql("INSERT INTO pages (ID, type, text) VALUES (?,?,?)",[val['page'],val['type'],JSON.stringify(val['text'])],function(){});
								});
							},function(){},function(){
								loader = true;
								setLastVersion(true);
								location.href = 'index.html';
								$$('#ldTimer .loadpersent').html('Загрузка данных завершена');
								$$('#ldTimer .loadpersent').css({'width': '100%'});
							});
							
						}
					},
					error : function(){
						
						$$('#ldTimer .loadpersent').html('Ошибка связи.');
						$$('#ldTimer .loadpersent').css({'width': '100%', 'background':'red'});
						$$("#loadBase").show();
						
					}
				});
			}
		
		}
	
	}
	},150);
	
}
