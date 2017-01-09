// Initialize your app

window.initCustomJs = false;

window.onPageGenerate = false;
window.connection = false;

var myApp = new Framework7({
	//precompileTemplates: true,
	modalButtonOk: 'Подвердить',
	modalButtonCancel: 'Отменить',
	swipeBackPage: false,
	sortable: false,
	swipeout: false,
	swipePanel: 'left',
});
// Export selectors engine
var $$ = Dom7;
//templates
var tmpl = false;

//таймаут получения контента
var loadCnt = false;

var loadVersion = false;

//текущая страница
var curentPage = false;

//sql
document.addEventListener("deviceready",onRd,false);
var db = false;
function onRd(){

document.addEventListener("backbutton", function(){
	myApp.openPanel("left");
	return false;
}, false);

if(typeof(openDatabase) !== 'undefined'){
	db = openDatabase('main','1.0','Main Base',5*1024*1024);
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
}else{
	//db = window.sqlitePlugin.openDatabase({name:'main.db'});
}

}

function checkConnection() {
    if(typeof navigator.connection != 'undefined'){
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

    window.connection = states[networkState];
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
	//console.log(tmpl);
	if(!tmpl[id]) return "";
	return tmpl[id];
}

//version
var version = localStorage.getItem('version');
if(!version) version = '1.0.0';

//таймаут обновлений
var loader = false;

// Add view
var mainView = myApp.addView('.view-main',{
  dynamicNavbar: false
});

function getPage(page){
	checkConnection();
	curentPage = page;
	
	var content='';

	if(page=='main'){
	checkVersion();
	
	var timer = setTimeout(function t(){
	if(loadVersion) {
		setTimeout(t,300);
	}else{
		
		var last = checkVersion();
		if(last != version) page = 'main_old';
		if(!window.connection) page = 'main_offline';
		lpage(page);
		
	}
	},1000);
	
	
	}else{
		lpage(page);
	}
	
	function lpage(page){
	db.transaction(function(tx){
	tx.executeSql("SELECT * FROM pages WHERE ID=?",[page],function(t,res){
	if(res.rows.length > 0){
	var tmp = getTmpl(res.rows.item(0)['type']);
	if(!tmp){
		loadCnt = '<p class="errorPage">ERROR load page '+page+'</p>';
	}else{
		if(window.onPageGenerate !== false) {
			loadCnt = window.onPageGenerate(page,JSON.parse(res.rows.item(0)['text']),tmp);
		}
		if(!loadCnt){
		var compiled = Template7(tmp).compile();
		loadCnt = compiled(JSON.parse(res.rows.item(0)['text']));
		}
	}
	}
	
	if((page == 'main' || page == 'main_old') && !loadCnt){
		content = '' +                  
		'<div class="content-block"> <div class="content-block-title">Расписание городских автобусов города Мозыря</div><div class="content-block inset"><div class="content-block-inner">'+
		'<p>Это первый запуск приложения, вам необходимо загрузить базу расписаний.</p>'+
		'<p><a href="#" id="loadBase" class="button active">Загрузить базу</a></p><p></p>'+
		'</div>' +
								'</div>'
		'</div>' +
		'';
		loadCnt = content;
	}
	
	if(!loadCnt) loadCnt = '<p class="errorPage">ERROR load page '+page+'</p>';
	},
	function(tx,err){
	loadCnt = '<p class="errorPage">ERROR sql load page '+page+'</p>';
	}
	);
	});
	}

}

var startPageContent = function(content){
	if(content) content = content.replace("link.html?page=","");
	if(!content) content = 'main';
	getPage(content);
};



var timer = setTimeout(function t(){
	if(!loadCnt) {
		setTimeout(t,300);
	}else{
		content = loadCnt;
		loadCnt = false;
		content = '<div class="page with-subnavbar" data-page="index"><div class="page-content">'+content+'</div></div>';
		
		mainView.router.load({
		  content: content,
		  animatePages: false
		});
		
		loadMenu();
		loadCss();
		loadJs();
		refreshBook();
	}
},300);

myApp.onPageInit('link', function (page) {

mainView = myApp.addView('.view-main',{
  dynamicNavbar: false
});
startPageContent(page.url);

var timer = setTimeout(function t(){
if(!loadCnt) {
	setTimeout(t,300);
}else{
content = loadCnt;
loadCnt = false;
content = '<div class="page with-subnavbar" data-page="index"><div class="page-content">'+content+'</div></div>';

mainView.router.load({
  content: content,
  animatePages: false
});

if(window.initPageLoad){
setTimeout(function(){
	window.initPageLoad();
},500);
}
	
}
},300);

});


$$(document).on('click', '.closep', function (e) {
myApp.closePanel();
});



function checkVersion(add){
var last = localStorage.getItem('last_version');
if(!last) last = '1.0.0';
if(last == version){
	//check update;
	if(window.connection){
		loadVersion = true;
		$$.get('http://mlife.by/ajax/rasp_android/version-.php',{},function(data){
		if(data != version) {
			localStorage.setItem('last_version',data);
			//return checkVersion();
		}
		loadVersion = false;
		});
	}
}
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
db.transaction(function(tx){
	tx.executeSql("SELECT * FROM block WHERE ID=?",['js'],function(t,res){
	if(res.rows.length > 0){
	var d = res.rows.item(0)['text'];
	$$('#jsBlock').html(d);
	setTimeout(function(){
		if(window.initCustomJs){
			window.initCustomJs();
		}else{
			var scr = $$("#jsBlock").html();
			eval(scr);
			window.initCustomJs();
		}
	},500);
	}
	});
});
}

function refreshBook(){
	db.transaction(function(tx){
		tx.executeSql("SELECT * FROM book",[],function(t,res){
		if(res.rows.length > 0){
			var c = '<div class="list-block color-pink" id="defBook" style="margin-top:0;"><ul>';
			for(var i=0;i<res.rows.length;i++){
				c += ''+
				'<li>'+
				'<a class="closep color-pink item-link item-content" href="link.html?page='+res.rows.item(i)['ID']+'">'+
				'	<div class="item-inner">'+
				'		<div class="item-title">'+
				'			'+res.rows.item(i)['text']+''+
				'		</div>'+
				'		<div class="item-after"></div>'+
				'	</div>'+
				'</a>'+
				'</li>'+
				'';
			}
			c += '</ul></div>';
			$$("#defBook").remove();
			$$(".panel-right").append(c);
		}else{
			var c = '<div id="defBook" class="content-block"><div class="center color-white" style="text-align:center;font-weight:bold;">'+
			'Список избранного пуст.</br></br>Вы можете добавить сюда страницы для быстрого доступа.</div></div>';
			$$("#defBook").remove();
			$$(".panel-right").append(c);
		}
		});
	});
}

$$(document).on('click', '.bookmarkDel', function () {
	db.transaction(function(tx){
		tx.executeSql("DELETE FROM book WHERE ID=?",[curentPage],function(){
			refreshBook();
		});
		myApp.alert('Страница удалена из избранного','Уведомление');
	});
});

$$(document).on('click', '#exit', function () {
	if (navigator && navigator.app) {
         navigator.app.exitApp();
    }else{
        if (navigator && navigator.device) {
            navigator.device.exitApp();
		}
    }
});

$$(document).on('click', '.bookmarkAdd', function () {
    myApp.prompt('Название вкладки', 'Добавить в избранное', 
      function (value) {
		if(!value) value = 'Избранное '+curentPage;
		db.transaction(function(tx){
			tx.executeSql("SELECT * FROM book WHERE ID=?",[curentPage],function(t,res){
			if(res.rows.length > 0){
				myApp.alert('Страница уже добавлена','Уведомление');
			}else{
				tx.executeSql("INSERT INTO book (ID, text) VALUES (?,?)",[curentPage,value],function(){
					refreshBook();
				});
				myApp.alert('Страница добавлена в избранное','Уведомление');
			}
			});
		});
        
      },
      function (value) {
        
      }
    );
});

$$(document).on('click', '#loadBase',function (e) {
checkConnection();
if(!window.connection) {
	myApp.alert('Нет соединения, загрузка базы невозможна.','Уведомление');
	return;
}

myApp.showPreloader('Идет загрузка данных...')
$$("#loadBase").remove();

var cntTimer = 0;

var timer = setTimeout(function t(){
if(!loader) {
	cntTimer++;
if(cntTimer>800) loader = true;
	setTimeout(t,300);
}else{
$$("#pMain").click();
myApp.hidePreloader();
if(loader > 800){
myApp.alert('Произошла ошибка, плохое соединение с интернет. Попробуйте повторить загрузку.','Уведомление');
}
}
},1000);

db.transaction(function(tx){
	tx.executeSql("DELETE FROM block WHERE ID>0",[]);
	tx.executeSql("DELETE FROM pages WHERE ID>0",[]);
	tx.executeSql("DELETE FROM tmpl WHERE ID>0",[]);
},function(){},function(){
	
	$$.ajax({
		url : 'http://mlife.by/ajax/rasp_android/tmpl.php',
		async : false,
		data : {},
		dataType: 'json',
		success : function(data){
			db.transaction(function(tx){
				$$.each(data, function (index, value) {
					tx.executeSql("INSERT INTO tmpl (ID, text) VALUES (?,?)",[index,value],function(){});
				});
			},function(r){
			},function(){
				setTmpl();
			});
		}
	});
	
	$$.ajax({
		url : 'http://mlife.by/ajax/rasp_android/menu.php',
		async : false,
		data : {},
		success : function(data){
			if(data) {
				db.transaction(function(tx){
				tx.executeSql("INSERT INTO block (ID, text) VALUES (?,?)",['menu',data],function(){
				loadMenu();
				});
				});
			}
		}
	});
	
	$$.ajax({
		url : 'http://mlife.by/ajax/rasp_android/js.php',
		async : false,
		data : {},
		success : function(data){
			if(data) {
				db.transaction(function(tx){
				tx.executeSql("INSERT INTO block (ID, text) VALUES (?,?)",['js',data],function(){
				window.initCustomJs = false;
				loadJs();
				});
				});
			}
		}
	});
	
	$$.ajax({
		url : 'http://mlife.by/ajax/rasp_android/styles.php',
		async : false,
		data : {},
		success : function(data){
			if(data) {
				db.transaction(function(tx){
				tx.executeSql("INSERT INTO block (ID, text) VALUES (?,?)",['styles',data],function(){
				loadCss();
				});
				});
			}
		}
	});
	
	$$.ajax({
		url : 'http://mlife.by/ajax/rasp_android/pages.php',
		async : false,
		data : {},
		dataType: 'json',
		success : function(data){
			var cnt = 0;
			var pages = '';
			$$.each(data, function (index, page) {
				cnt = cnt + 1;
				if(cnt < 15){
					pages += page+",";
				}else{
					pages += page+",";
					$$.ajax({
						url : 'http://mlife.by/ajax/rasp_android/getpage.php',
						async : false,
						data : {pages: pages},
						dataType: 'json',
						success : function(dt){
							setPages(dt,false);
						}
					});
					pages = '';
					cnt = 0;
				}
			});
			if(cnt>0) {
				$$.ajax({
					url : 'http://mlife.by/ajax/rasp_android/getpage.php',
					async : false,
					data : {pages: pages},
					dataType: 'json',
					success : function(dt){
						setPages(dt,true);
					}
				});
			}
		}
	});
	
	function setPages(data,load){
		
		db.transaction(function(tx){
			$$.each(data, function (ind, val) {
				tx.executeSql("INSERT INTO pages (ID, type, text) VALUES (?,?,?)",[val['page'],val['type'],JSON.stringify(val['text'])],function(){});
			});
		},function(){},function(){
			if(load){
			loader = true;
			setLastVersion(true);
			}
		});
		
		
	}

});

});
