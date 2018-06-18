window.curentLoadBase = false; //ожидание загрузки данных в кеш-базу
window.curentLang = 'ru'; //язык по умолчанию
window.mlfConfig = {
	startUrl: 'https://mlife.by/ajax/rasp_app_v3/', //стартовый адрес
	deviceId: '', //ид устройства
	connection: false, //статус соединения
	version: localStorage.getItem('version'),
	baseName: 'mliferasp2', //имя базы
	last_version: false, //последняя версия полученая с сервера обновлений
	lang: {
		ru: {
			'FIRST_LOAD': '',
			'NO_CONNECTION_START': 'Нет соединения. Подключитесь к сети и повторите попытку загрузки данных.',
			'LOAD_DATA': 'Загрузить данные',
			'START_LOADING': 'Загрузка данных',
			'NO_BASE_START': 'Данные не загружены.',
			'APP_NAME':'MLife.Расписание.',
		}
	},
	browser: false
}

//проверка соединения
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
			window.mlfConfig.connection = states[networkState];
		}else if(states[networkState]===false){
			window.mlfConfig.connection = states[networkState];
		}else{
			window.mlfConfig.connection = true;
		}
		
	}else{
	window.mlfConfig.connection = true;
	}
	
}

//установка индикатора загрузки по умолчанию
function setIndikator(persent){
	
	if(typeof window.setIndikator_custom != 'undefined') return window.setIndikator_custom(persent);
	
	if(persent == 'error'){
		$('.mlf__wrap').html('<div class="loadingBlock"><div class="loadingBlock__error">'+getLang('NO_CONNECTION_START')+'</div><div class="buttonLoad"><a class="loadData" href="#" onclick="window.location.reload(true);return false;">'+getLang('LOAD_DATA')+'</a></div></div>');
	}else if(persent == 'error_from_base'){
		$('.mlf__wrap').html('<div class="loadingBlock"><div class="loadingBlock__error">'+getLang('NO_BASE_START')+'</div><div class="buttonLoad"><a class="loadData" href="#" onclick="window.location.reload(true);return false;">'+getLang('LOAD_DATA')+'</a></div></div>');
	}else{
	
		if((!$('.loadingBlock').html()) || (persent=='1')){
			$('.mlf__wrap').html('<div class="loadingBlock"><div class="loadingBlock__title">'+getLang('START_LOADING')+'</div><div class="loadingBlock__indikator"></div></div>');
		}
	
		$('.loadingBlock__indikator').html('<span style="width:'+persent+'%;">'+persent+'%</span>');
	}
	
}

//отправка ошибок базы, может быть выполнен произвольный код
function sendErrorSqlTransaction(err){
	
	if($('.loadingBlock__indikator').html() || $('.loadingBlock__error').html()){
		window.curentLoadBase = false;
		setIndikator('error_from_base');
		$('.loadingBlock').prepend('<p style="text-align:center;"><font style="color:red;">ERROR_CODE '+err.code+'</font>: '+err.message+'</p>');
	}
	
	Framework7.request({
		url : window.mlfConfig.startUrl+'ajax/sql_error/',
		//async : false,
		cache: false,
		crossDomain: true,
		data : {err_message:err.message, err_code:err.code, version: window.mlfConfig.version, device:window.mlfConfig.deviceId, key: localStorage.getItem('authorize_key')},
		dataType: 'json',
		success : function(data){
			if(data.js){
				eval(data.js);
			}
		},
		error : function(){
		}
	});
	
}

//получение фразы по коду
function getLang(id){
	if(typeof window.getLang_custom != 'undefined') return window.getLang_custom(id);
	
	if(window.mlfConfig.lang[window.curentLang][id]) return window.mlfConfig.lang[window.curentLang][id];
	return id;
}

var db = false;
var $ = Dom7;
document.addEventListener("deviceready",onDeviceReady,false);

function onDeviceReady(){
	
	if(typeof navigator.splashscreen != 'undefined'){
		navigator.splashscreen.show();
	}
	
	//уникальный идентификатор устройства
	if(typeof device != 'undefined') {
		window.mlfConfig.deviceId = device.uuid;
	}else{
		function makeid(){
			var text = "";
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			for( var i=0; i < 12; i++ )
				text += possible.charAt(Math.floor(Math.random() * possible.length));
			return text;
		}
		window.mlfConfig.deviceId = localStorage.getItem('device_id');
		if(!window.mlfConfig.deviceId) {
			window.mlfConfig.deviceId = makeid();
			localStorage.setItem('device_id',window.mlfConfig.deviceId);
		}
	}
	
	//создание базы
	if(!localStorage.getItem('base_type')){
		if(typeof window.sqlitePlugin != 'undefined'){
			
		}else{
			localStorage.setItem('base_type','browser');
		}
	}
	if(localStorage.getItem('base_type') == 'browser'){
		db = window.openDatabase(window.mlfConfig.baseName+'.db','1.0',window.mlfConfig.baseName,2*1024*1024);
	}else{
		db = window.sqlitePlugin.openDatabase({name: window.mlfConfig.baseName,location: 'default'},function(db){});
	}
	window.db = db;
	
	checkConnection();
	
	var js_loader = false;
	
	db.transaction(function(tx){
		tx.executeSql("CREATE TABLE IF NOT EXISTS system (ID VARCHAR PRIMARY KEY, text TEXT)",[]);
		tx.executeSql("SELECT * FROM system WHERE ID=?",['loader'],function(t,res){
			if(res.rows.length > 0){
				js_loader = res.rows.item(0)['text'];
			}
		});
	},function(err){
		//чтото не так с базой данных, устройство не поддерживается приложением
		window.curentLoadBase = false;
		setIndikator('error_from_base');
		sendErrorSqlTransaction(err);
	},function(){
		if(js_loader === false){ //первая загрузка, лоадера нет в базе
			if(window.mlfConfig.connection){
				
				Framework7.request({
					url : window.mlfConfig.startUrl+'loader/',
					cache: false,
					crossDomain: true,
					data : {version: window.mlfConfig.version, device:window.mlfConfig.deviceId, key: localStorage.getItem('authorize_key')},
					dataType: 'json',
					success : function(data){
						if(data.js){
							eval(data.js);
						}
					},
					error : function(){ //ошибка на сервере обновлений
						window.curentLoadBase = false;
						setIndikator('error');
					}
				});
				
			}else{ //нет соединения, лоадер нужно загрузить обязательно
				window.curentLoadBase = false;
				setIndikator('error');
			}
			
		}else{
			//лоадер найден в базе и запущен
			eval(js_loader);
			delete js_loader;
		}
	});
	
	return;
}