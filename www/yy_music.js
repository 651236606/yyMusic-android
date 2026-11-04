/**
 * name: YYMusicPlayer
 * version: 1.2.1
 */
! function(win) {
	var formatTime = function(s) {
		if (s > 0) {
			var MM = Math.floor(s / 60);
			var SS = Math.ceil(s % 60);
			if (MM < 10) {
				MM = "0" + MM;
			}
			if (SS < 10) {
				SS = "0" + SS;
			}
			var min = MM + ":" + SS;
			return min.split('.')[0];
		} else {
			return "00:00";
		}
	},
    storage = function(table, settings, storage) {
        table = table || "yyMusic";
        storage = storage || localStorage;
        if (!window.JSON || !window.JSON.parse) return;
        if (settings === null) {
            return delete storage[table];
        }
        settings = typeof settings === "object" ? settings : {
            key: settings
        };
        try {
            var data = JSON.parse(storage[table]);
        } catch (e) {
            var data = {};
        }
        if ("value" in settings) data[settings.key] = settings.value;
        if (settings.remove) delete data[settings.key];
        storage[table] = JSON.stringify(data);
        return settings.key ? data[settings.key] : data;
    },
    setData = function(key, value){
        return storage('yyMusic', {
            key: key,
            value: value
        });
    },
    getData = function(key){
        var d = storage('yyMusic');
        return d[key];
    },
    isURL = function(url) {
        const pattern = new RegExp('^(https?:\\/\\/)?' +
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
            '((\\d{1,3}\\.){3}\\d{1,3}))' +
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
            '(\\?[;&a-z\\d%_.~+=-]*)?' +
            '(\\#[-a-z\\d_]*)?$|' +
            '^(\\.{0,2})?\\/[-a-z\\d%_.~+]*(\\/[-a-z\\d%_.~+]*)*' +
            '(\\?[;&a-z\\d%_.~+=-]*)?' +
            '(\\#[-a-z\\d_]*)?$', 'i');
        return !!pattern.test(url);
    },
	getHash = function (name) {
		let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
		let r = window.location.hash.substr(1).match(reg);
		if (r != null) {
			return decodeURI(r[2]);
		};
		return null;
	},
	type = function(operand) {
		if (operand === null) return String(operand);
		return (typeof operand === 'object' || typeof operand === 'function') ? function() {
			var type = Object.prototype.toString.call(operand).match(/\s(.+)\]$/) || [];
			var classType = 'Function|Array|Date|RegExp|Object|Error|Symbol';
			type = type[1] || 'Object';
			return new RegExp('\\b(' + classType + ')\\b').test(type) ? type.toLowerCase() : 'object';
		}() : typeof operand;
	},
	extend = function (...args) {
        const target = args[0];
        for (let i = 1; i < args.length; i++) {
            const source = args[i];
            for (let key in source) {
                if (source.hasOwnProperty(key)) {
                    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                        if (!target[key]) {
                            target[key] = {};
                        }
                        extend(target[key], source[key]);
                    } else {
                        target[key] = source[key];
                    }
                }
            }
        }
        return target;
    },
	DefaultConfig = {
		name: "夜雨音乐",
		autoplay: false,
		loop: false,
		volume: 0.8,
		path: '/',
		skin: '',
		SinglePlay: true
	},
	yyMusic = function(opt = {}) {
		let that = this;
		that.data = {};
        that.initPlayer(opt);
        that.Refresh();
	};
	yyMusic.prototype.initPlayer = function (opt) {
		let that = this;
		that.callbacks = [];
		that.callback = function(data) {
			that.callbacks.forEach((callback) => {
				callback(data);
			});
		};
		that.data.config = extend(DefaultConfig, opt);
		that.elem = opt.elem || "body";
		var MusicView = 
        `<div class="yyMusic">
            <div class="yyMusicHeader">
                <div class="yyMusicTitle">夜雨音乐</div>
                <div class="yyMusicRight">
                    <a href="#m=musiclists" class="musiclists">推荐</a>
                    <a href="#m=playlists" class="playlists">歌单</a>
                    <a href="#m=toplist" class="toplist">TOP</a>
                    <a class="settingsBtn" id="settingsBtn" title="下载设置">设置</a>
                </div>
            </div>
            <div class="yyMusicMain">
                <div class="blur"></div>
                <div class="yyMusicList">
                    <div class="music-table-wrap">
                        <div class="music-data-list webTab">
                            <div class="musiclist_top">
                                <div class="musiclist_flex">
                                    <div class="list_bar">
                                        <a id="defaultPlaylist" class="defaultPlaylist currentList">默认歌单</a>
                                        <!--a id="myPlaylist" class="myPlaylist">我的歌单</a-->
                                        <a id="myFavorites" class="myFavorites">我的收藏</a>
                                        <a id="playAll" class="playAllBtn"><i class="yymc yymc-play"></i> 播放全部</a>
                                        <a id="importPlaylist" class="importBtn"><i class="yymc yymc-add"></i> 导入歌单</a>
                                    </div>
                                    <div class="flex_r">
                                        <!--a class="addPlaylist"><i class="yymc yymc-add"></i> 歌单</a-->
                                        <a class="searchBtn"><form id="search"><input id="keyword" name="keyword" placeholder="搜索"><button type="submit"><i class="yymc yymc-search submit"></i></button></form></a>
                                    </div>
                                </div>
                            </div>
                            <table class="music-table">
                                <thead>
                                    <tr>
                                        <th></th>      <th>歌曲名</th>      <th>歌手</th>      <th>收藏</th>      <th class="download-col">下载</th>
                                    </tr>
                                </thead>
                            </table>
                            <div class="table-scroll">
                                <table class="music-table currentList" for="defaultPlaylist">
                                    <tbody class="list_data"></tbody>
                                </table>
                                <table class="music-table" for="myPlaylist">
                                    <tbody class="list_data"></tbody>
                                </table>
                                <table class="music-table" for="myFavorites">
                                    <tbody class="list_data"></tbody>
                                </table>
                                <table class="music-table" for="searchList">
                                    <tbody class="list_data"></tbody>
                                </table>
                            </div>
                        </div>
                        <div class="wyy-list webTab">
                            <div class="wyy-list-cats">
                                <div class="playlist_menu"><dl class="f-cb"><dt class="playlists_typeName">选择</dt><dd><a href="#m=playlists&cat=全部" cat="全部">全部</a></dd></dl><dl class="f-cb"><dt class="playlists_typeName">语种</dt><dd><a class="playlists_class" href="#m=playlists&cat=华语" cat="华语">华语</a> <a class="playlists_class" href="#m=playlists&cat=欧美" cat="欧美">欧美</a> <a class="playlists_class" href="#m=playlists&cat=日语" cat="日语">日语</a> <a class="playlists_class" href="#m=playlists&cat=韩语" cat="韩语">韩语</a> <a class="playlists_class" href="#m=playlists&cat=粤语" cat="粤语">粤语</a></dd></dl><dl class="f-cb"><dt class="playlists_typeName">风格</dt><dd><a class="playlists_class" href="#m=playlists&cat=流行" cat="流行">流行</a> <a class="playlists_class" href="#m=playlists&cat=摇滚" cat="摇滚">摇滚</a> <a class="playlists_class" href="#m=playlists&cat=民谣" cat="民谣">民谣</a> <a class="playlists_class" href="#m=playlists&cat=电子" cat="电子">电子</a> <a class="playlists_class" href="#m=playlists&cat=舞曲" cat="舞曲">舞曲</a> <a class="playlists_class" href="#m=playlists&cat=说唱" cat="说唱">说唱</a> <a class="playlists_class" href="#m=playlists&cat=轻音乐" cat="轻音乐">轻音乐</a> <a class="playlists_class" href="#m=playlists&cat=爵士" cat="爵士">爵士</a> <a class="playlists_class" href="#m=playlists&cat=乡村" cat="乡村">乡村</a> <a class="playlists_class" href="#m=playlists&cat=R%26B%2FSoul" cat="R&B/Soul">R&B/Soul</a> <a class="playlists_class" href="#m=playlists&cat=古典" cat="古典">古典</a> <a class="playlists_class" href="#m=playlists&cat=民族" cat="民族">民族</a> <a class="playlists_class" href="#m=playlists&cat=英伦" cat="英伦">英伦</a> <a class="playlists_class" href="#m=playlists&cat=金属" cat="金属">金属</a> <a class="playlists_class" href="#m=playlists&cat=朋克" cat="朋克">朋克</a> <a class="playlists_class" href="#m=playlists&cat=蓝调" cat="蓝调">蓝调</a> <a class="playlists_class" href="#m=playlists&cat=雷鬼" cat="雷鬼">雷鬼</a> <a class="playlists_class" href="#m=playlists&cat=世界音乐" cat="世界音乐">世界音乐</a> <a class="playlists_class" href="#m=playlists&cat=拉丁" cat="拉丁">拉丁</a> <a class="playlists_class" href="#m=playlists&cat=New%20Age" cat="New Age">New Age</a> <a class="playlists_class" href="#m=playlists&cat=古风" cat="古风">古风</a> <a class="playlists_class" href="#m=playlists&cat=后摇" cat="后摇">后摇</a> <a class="playlists_class" href="#m=playlists&cat=Bossa%20Nova" cat="Bossa Nova">Bossa Nova</a></dd></dl><dl class="f-cb"><dt class="playlists_typeName">场景</dt><dd><a class="playlists_class" href="#m=playlists&cat=清晨" cat="清晨">清晨</a> <a class="playlists_class" href="#m=playlists&cat=夜晚" cat="夜晚">夜晚</a> <a class="playlists_class" href="#m=playlists&cat=学习" cat="学习">学习</a> <a class="playlists_class" href="#m=playlists&cat=工作" cat="工作">工作</a> <a class="playlists_class" href="#m=playlists&cat=午休" cat="午休">午休</a> <a class="playlists_class" href="#m=playlists&cat=下午茶" cat="下午茶">下午茶</a> <a class="playlists_class" href="#m=playlists&cat=地铁" cat="地铁">地铁</a> <a class="playlists_class" href="#m=playlists&cat=驾车" cat="驾车">驾车</a> <a class="playlists_class" href="#m=playlists&cat=运动" cat="运动">运动</a> <a class="playlists_class" href="#m=playlists&cat=旅行" cat="旅行">旅行</a> <a class="playlists_class" href="#m=playlists&cat=散步" cat="散步">散步</a> <a class="playlists_class" href="#m=playlists&cat=酒吧" cat="酒吧">酒吧</a></dd></dl><dl class="f-cb"><dt class="playlists_typeName">情感</dt><dd><a class="playlists_class" href="#m=playlists&cat=怀旧" cat="怀旧">怀旧</a> <a class="playlists_class" href="#m=playlists&cat=清新" cat="清新">清新</a> <a class="playlists_class" href="#m=playlists&cat=浪漫" cat="浪漫">浪漫</a> <a class="playlists_class" href="#m=playlists&cat=伤感" cat="伤感">伤感</a> <a class="playlists_class" href="#m=playlists&cat=治愈" cat="治愈">治愈</a> <a class="playlists_class" href="#m=playlists&cat=放松" cat="放松">放松</a> <a class="playlists_class" href="#m=playlists&cat=孤独" cat="孤独">孤独</a> <a class="playlists_class" href="#m=playlists&cat=感动" cat="感动">感动</a> <a class="playlists_class" href="#m=playlists&cat=兴奋" cat="兴奋">兴奋</a> <a class="playlists_class" href="#m=playlists&cat=快乐" cat="快乐">快乐</a> <a class="playlists_class" href="#m=playlists&cat=安静" cat="安静">安静</a> <a class="playlists_class" href="#m=playlists&cat=思念" cat="思念">思念</a></dd></dl><dl class="f-cb"><dt class="playlists_typeName">主题</dt><dd class="last"><a class="playlists_class" href="#m=playlists&cat=综艺" cat="综艺">综艺</a> <a class="playlists_class" href="#m=playlists&cat=影视原声" cat="影视原声">影视原声</a> <a class="playlists_class" href="#m=playlists&cat=ACG" cat="ACG">ACG</a> <a class="playlists_class" href="#m=playlists&cat=儿童" cat="儿童">儿童</a> <a class="playlists_class" href="#m=playlists&cat=校园" cat="校园">校园</a> <a class="playlists_class" href="#m=playlists&cat=游戏" cat="游戏">游戏</a> <a class="playlists_class" href="#m=playlists&cat=70后" cat="70后">70后</a> <a class="playlists_class" href="#m=playlists&cat=80后" cat="80后">80后</a> <a class="playlists_class" href="#m=playlists&cat=90后" cat="90后">90后</a> <a class="playlists_class" href="#m=playlists&cat=网络歌曲" cat="网络歌曲">网络歌曲</a> <a class="playlists_class" href="#m=playlists&cat=KTV" cat="KTV">KTV</a> <a class="playlists_class" href="#m=playlists&cat=经典" cat="经典">经典</a> <a class="playlists_class" href="#m=playlists&cat=翻唱" cat="翻唱">翻唱</a> <a class="playlists_class" href="#m=playlists&cat=吉他" cat="吉他">吉他</a> <a class="playlists_class" href="#m=playlists&cat=钢琴" cat="钢琴">钢琴</a> <a class="playlists_class" href="#m=playlists&cat=器乐" cat="器乐">器乐</a> <a class="playlists_class" href="#m=playlists&cat=榜单" cat="榜单">榜单</a> <a class="playlists_class" href="#m=playlists&cat=00后" cat="00后">00后</a></dd></dl></div> 
                            </div>
                            <div class="wyy-playlists">
                                <div class="wyy-data_list">
                                    <div class="data-null">暂无歌单</div>
                                </div>
                            </div>
                        </div>
                        <div class="wyy-playlist webTab"></div>
                    </div>
                </div>
                <div class="yyMusicLrc">
                    <div class="yyMusicLrc_w">
                        <div class="yyMusicAlbum">
                            <div class="albumPoster">
                                <div class="image" style="background-image:url(style/image.jpg)"></div>
                            </div>
                        </div>
                        <div class="lrcText">
                           <div class="defaultLrc">夜雨音乐</div>
                           <div class="loadLrc" style="display:none"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="playlist">
                <div class="shade"></div>
                <div class="music-table-wrap">
                    <table class="music-table">
                        <thead>
                            <tr>
                                <th></th>      <th>歌曲名</th>      <th>歌手</th>      <th>收藏</th>      <th class="download-col">下载</th>
                            </tr>
                        </thead>
                    </table>
                    <div class="table-scroll">
                        <table class="music-table">
                            <tbody class="playlistData"></tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="yyMusicView">
                <div class="progress" id="progress"></div>
                <canvas id="spectrumOut" style="position: absolute;z-index: 1;width: 100%;height: 60px;bottom:0;left: 0"></canvas>
                <div class="playbtn">
                    <a id="paused" class="paused"><i class="yymc yymc-play" title="播放 / 暂停"></i></a>
                    <a id="nextPlay" class="nextPlay"><i class="yymc yymc-next" title="下一首"></i></a>
                </div>
                <div class="audioTime">
                   <span id="currentTime" class="currentTime">00:00</span> / <span id="duration" class="duration">00:00</span>
                </div>
                <div class="songname" id="SongName">夜雨音乐</div>
                <div class="playbtn music-r">
                    <a id="order" class="order"><i class="yymc yymc-repeat" title="循环"></i></a>
                    <a id="songlist" class="songlist"><i class="yymc yymc-music-list" title="列表"></i></a>
                    <a id="songlrc" class="songlrc"><i class="yymc yymc-music_lyric" title="歌词"></i></a>
                </div>
            </div>
            <audio preload="auto" referrerpolicy="no-referrer">
        </div>`;
		$(that.elem).html(MusicView);
		that.data.config.skin && $(that.elem).addClass(that.data.config.skin);
		that.audio = $(that.elem).find('audio')[0];
		that.data.playlist = getData('playlist') || [];
		that.data.myFavorites = getData('myFavorites') || [];
        that.renderPlayerlist();
        that.data.order = getData('order') || 1;
        
		var order = that.data.order;
		if(order === 2){
		    $(that.elem).find('.order').find('i').removeClass().addClass('yymc yymc-normal').attr('title', '列表循环');
		}
		else if(order === 3){
		    $(that.elem).find('.order').find('i').removeClass().addClass('yymc yymc-random').attr('title', '随机播放');
		}
		else if(order === 1){
		    $(that.elem).find('.order').find('i').removeClass().addClass('yymc yymc-repeat').attr('title', '单曲循环');
		}
		$(function(){
		    that.AudioEvent();
    		var currentAudio = getData('currentAudio') || {};
    		currentAudio && that.PlayAudio(currentAudio);
		});
	};
	
    yyMusic.prototype.Refresh = function () {
        let that = this;
		var m = getHash('m');
		switch (m) {
			case 'playlists':
				let cat = getHash('cat')?decodeURIComponent(getHash('cat')) : '全部';
				that.playlists(cat, getHash('page') || 1);
				$(that.elem+" .playlists").addClass("onNav").siblings().removeClass("onNav");
				$(that.elem+" .webTab").hide();
				$(that.elem+" .wyy-list").show();
				break;
			case 'playlist':
			    that.playlist(getHash('id'));
				$(that.elem+" .webTab").hide();
				$(that.elem+" .wyy-playlist").show();
				break;
			case 'toplist':
			    layer.msg('功能开发中');
				break;
			case 'musiclists':
			default:
				$(that.elem+" .musiclists").addClass("onNav").siblings().removeClass("onNav");
    			$(that.elem+' .webTab').hide();
    			$(that.elem+' .music-data-list').show();
		}
	};
	yyMusic.prototype.playlist = function(playlistId){
        let that = this;
        let $box = $(that.elem+' .wyy-playlist');
        $box.html('<div class="data-null">正在加载歌单…</div>');
		$.get(that.apiUrl('API/'),{playlist: playlistId},(res)=>{
		    if(res.code == 0){
        	    var div =  `<div class="listInfo ${res.image && 'showImg'}">
                        <div class="listImage" style="background-image:url(${res.image})"></div>
                        <div class="listTitle">
                            <h2>${res.title}</h2>
                            <p>${res.description}</p>
                        </div>
                    </div>
                    <table class="music-table">
                        <thead>
                            <tr>
                                <th></th>      <th>歌曲名</th>      <th>歌手</th>      <th>收藏</th>      <th class="download-col">下载</th>
                            </tr>
                        </thead>
                        <tbody>`;
        	    for(var i=0; i< res.data.length; i++){
    		        let item = res.data[i];
    		        let curr = item.mid === that.data.currMid ? 'curr' : '';
                    let hasFav = that.data.myFavorites.findIndex(s => s.mid === item.mid) !== -1;
        	        div += `<tr class="mid_${item.mid} ${curr}">
        				<td></td>
        				<td><a act="PlayAudio" data-opt='${JSON.stringify(item)}' data-mid="${item.mid}" title="${item.SongName}">${item.SongName}</a></td>
        				<td>${item.singer || '未知歌手'}</td>
        				<td><span class="Favorite yymc ${hasFav ? 'yymc-fav-a' : 'yymc-fav'} FavMid_${item.mid}" data-opt='${JSON.stringify(item)}'></span></td>
				<td class="download-col"><a class="downloadBtn" data-opt='${JSON.stringify(item)}' title="下载">下载</a></td>
        			</tr>`;
    		    }
    		    div += `</tbody></table>`;
    		    $box.html(div);
				$('title').text(res.title);
	        } else {
                $box.html('<div class="data-null">歌单详情加载失败：' + ((res && res.msg) || '暂无数据') + '</div>');
            }
        }, "json").fail(function(xhr){
            var st = xhr ? xhr.status : 0;
            $box.html('<div class="data-null">歌单详情加载失败：' +
                (st === 0 ? '无法连接服务器（检查服务器地址）' : 'HTTP ' + st) + '</div>');
        });
	};
    yyMusic.prototype.playlists = function (cat, page=1) {
        let that = this;
        let $box = $(that.elem+' .wyy-data_list');
        $box.html('<div class="data-null">正在加载歌单…</div>');
        let failHtml = function(msg){
            $box.html('<div class="data-null">歌单加载失败：' + msg +
                '<br><a href="javascript:;" id="yeyuPlRetry" style="color:#6ea8ff">点击重试</a></div>');
            $('#yeyuPlRetry').off('click').on('click', function(){ that.playlists(cat, page); });
        };
		$.get(that.apiUrl('API/playlist.php'),{cat: cat,page: page},(res)=>{
		    if(res.code == 0){
    		    var div = '';
    		    for(var i=0; i< res.playlist.length; i++){
    		        let item = res.playlist[i];
    		        div += `<div class="wyy-data_item">
    		        <a href="#m=playlist&id=${item.id}" class="playlistItem">
    		            <div class="playlistPoster" style="background-image:url(${item.poster})">
    		                <span>${item.num}</span>
                        </div>
                        <label class="playlistTitle">${item.title}</label>
                        <p class="playlistAuthor">by：${item.author}</p>
                    </a></div>`;
    		    }
    		    $box.html(div);
    			$('.currCat').removeClass("currCat");
    			$("[cat='" + cat + "']").addClass("currCat");
				$('title').text(cat+ ' - 分类歌单');
		    } else {
                failHtml(res && res.msg ? res.msg : '暂无歌单');
            }
		}, "json").fail(function(xhr){
            var st = xhr ? xhr.status : 0;
            var tip = st === 404 ? '服务器上未找到 API/playlist.php（请重新上传 API 部署包）'
                    : (st === 0 ? '无法连接服务器（检查服务器地址 / 是否被强制跳转 HTTPS）'
                                : 'HTTP ' + st + '（服务端错误）');
            failHtml(tip);
        });
	};
    yyMusic.prototype.renderPlayerlist = function () {
        let that = this;
        let $tbody = $(that.elem).find('.playlistData');
        $tbody.empty();
        that.data.playlist.forEach(item => {
            let trClass = item.mid === that.data.currMid ? 'curr' : '';
            let hasFav = that.data.myFavorites.findIndex(s => s.mid === item.mid) !== -1;
            let tr = $(`
                <tr class="list_item mid_${item.mid} ${trClass}">
                    <td></td>
                    <td><a data-mid="${item.mid}" title="${item.SongName}">${item.SongName}</a></td>
                    <td>${item.singer || '未知歌手'}</td>
                    <td><span class="Favorite yymc ${hasFav ? 'yymc-fav-a' : 'yymc-fav'} FavMid_${item.mid}" data-opt='${JSON.stringify(item)}'></span></td>
				<td class="download-col"><a class="downloadBtn" data-opt='${JSON.stringify(item)}' title="下载">下载</a></td>
                </tr>
            `);
            $tbody.append(tr);
        })
    };
    yyMusic.prototype.clearPlayerlist = function(){
        let that = this;
        that.data.playlist = [];
        setData("playlist", that.data.playlist);
        that.renderPlayerlist();
    };
    yyMusic.prototype.delSong = function(mid){
        let that = this;
        that.data.playlist = that.data.playlist.filter(s=>s.mid!==mid);
        setData("playlist", that.data.playlist);
        that.renderPlayerlist();
    };
    yyMusic.prototype.favorite = function(option){
        var that = this;
        if(that.data.myFavorites.findIndex(s => s.mid === option.mid) !== -1){
            that.data.myFavorites = that.data.myFavorites.filter(s=>s.mid !== option.mid);
            $(that.elem).find('.Favorite.FavMid_'+option.mid).removeClass('yymc-fav-a').addClass('yymc-fav');
            layer.msg('取消收藏《'+option.SongName+'》', {offset: 'rt', anim: 'slideLeft'});
        }else{
            that.data.myFavorites.push(option);
            $(that.elem).find('.Favorite.FavMid_'+option.mid).addClass('yymc-fav-a').removeClass('yymc-fav');
            layer.msg('成功收藏《'+option.SongName+'》', {offset: 'rt', anim: 'slideLeft'});
        }
        setData("myFavorites", that.data.myFavorites);
    };

    /* 点击「下载」：先弹窗询问保存到「当前目录」还是「默认目录」，再执行下载 */
    yyMusic.prototype.downloadSong = function(item) {
        let that = this;
        let url = item.SongUrl;
        if (!url) { layer.msg('暂无下载地址', {offset:'rt', anim:'slideLeft'}); return; }
        if (that._isAndroid()) { that._downloadAndroid(item); return; }
        let name = (item.SongName || 'song').replace(/[\\/:*?"<>|\n\r\t]/g, '_').slice(0, 80);
        let w = window.yeyu;
        let configuredP = (w && w.getDownloadDir) ? w.getDownloadDir() : Promise.resolve('');
        let defaultP = (w && w.getDefaultDir) ? w.getDefaultDir() : Promise.resolve('');
        Promise.all([configuredP, defaultP]).then(function(dirs){
            let configured = (dirs[0] && String(dirs[0]).trim()) ? String(dirs[0]).trim() : '';
            let systemDefault = (dirs[1] && String(dirs[1]).trim()) ? String(dirs[1]).trim() : '';
            let currentDir = configured || systemDefault;
            that._showDownloadChoice(item, url, name, currentDir, systemDefault);
        }).catch(function(){
            that._doDownload(item, url, name, '');
        });
    };

    /* 下载目录选择弹窗：当前目录 = 设置里已配置的目录；默认目录 = 系统「下载」文件夹 */
    yyMusic.prototype._showDownloadChoice = function(item, url, name, currentDir, systemDefault) {
        let that = this;
        let sameDir = (!currentDir || currentDir === systemDefault);
        let esc = function(s){ return String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
        let mainBtns;
        if (sameDir) {
            mainBtns = `<button id="yeyuDlDefault" style="flex:1;padding:9px 0;border:1px solid #2b6cff;background:#2b6cff;color:#fff;border-radius:6px;cursor:pointer;font-size:13px;">保存到下载目录</button>`;
        } else {
            mainBtns = `<button id="yeyuDlCurrent" style="flex:1;padding:9px 0;border:1px solid #2b6cff;background:#2b6cff;color:#fff;border-radius:6px;cursor:pointer;font-size:13px;">保存到当前目录</button>`
                     + `<button id="yeyuDlDefault" style="flex:1;padding:9px 0;border:1px solid #444;background:#2a2a2a;color:#ddd;border-radius:6px;cursor:pointer;font-size:13px;">保存到默认目录</button>`;
        }
        let html = `
        <div style="padding:16px 18px;min-width:300px;color:#e8e8e8;font-family:inherit;">
            <div style="font-size:14px;font-weight:600;margin-bottom:4px;">下载《${esc(item.SongName || '')}》</div>
            <div style="font-size:12px;color:#999;margin-bottom:14px;">请选择保存位置：</div>
            <div style="font-size:12px;color:#bbb;line-height:1.8;">
                ${ sameDir ? '' : `当前目录：<span style="color:#9fc">${esc(currentDir)}</span><br>` }
                默认目录：<span style="color:#9fc">${esc(systemDefault)}</span>
            </div>
            <div style="margin-top:16px;display:flex;gap:10px;">${mainBtns}</div>
            <button id="yeyuDlBrowse" style="width:100%;margin-top:12px;padding:9px 0;border:1px solid #2b6cff;background:transparent;color:#6ea8ff;border-radius:6px;cursor:pointer;font-size:13px;">选择其他目录…</button>
            <div style="margin-top:12px;text-align:right;">
                <button id="yeyuDlCancel" style="padding:6px 14px;border:1px solid #444;background:transparent;color:#999;border-radius:6px;cursor:pointer;font-size:12px;">取消</button>
            </div>
        </div>`;
        layer.open({
            type: 1,
            title: '歌曲下载',
            area: [yyAreaW(360), 'auto'],
            shadeClose: true,
            content: html
        });
        $(document).off('click.yeyuDlChoice');
        if (!sameDir) {
            $(document).on('click.yeyuDlChoice', '#yeyuDlCurrent', function() {
                layer.closeAll();
                that._doDownload(item, url, name, currentDir);
            });
        }
        $(document).on('click.yeyuDlChoice', '#yeyuDlDefault', function() {
            layer.closeAll();
            that._doDownload(item, url, name, systemDefault);
        });
        $(document).on('click.yeyuDlChoice', '#yeyuDlBrowse', function() {
            layer.closeAll();
            that._browseAndDownload(item, url, name);
        });
        $(document).on('click.yeyuDlChoice', '#yeyuDlCancel', function() {
            layer.closeAll();
        });
    };

    /* 选择目录：打开系统文件夹选择框，把歌曲下载到所选目录，并设为默认下载目录 */
    yyMusic.prototype._browseAndDownload = function(item, url, name) {
        let that = this;
        if (!window.yeyu || !window.yeyu.pickDownloadDir) {
            layer.msg('当前环境不支持选择目录，将保存到默认目录', {offset:'rt', anim:'slideLeft'});
            that._doDownload(item, url, name, '');
            return;
        }
        layer.msg('请选择下载目录…', {offset:'rt', anim:'slideLeft'});
        window.yeyu.pickDownloadDir().then(function(res) {
            if (res && res.path) {
                that._doDownload(item, url, name, res.path);
                layer.msg('已下载到所选目录，并设为默认下载目录', {offset:'rt', anim:'slideLeft'});
            } else if (res && res.cancelled) {
                // 取消选择：重新打开下载位置弹窗
                let w = window.yeyu;
                Promise.all([
                    w.getDownloadDir ? w.getDownloadDir() : Promise.resolve(''),
                    w.getDefaultDir ? w.getDefaultDir() : Promise.resolve('')
                ]).then(function(dirs){
                    let configured = (dirs[0] && String(dirs[0]).trim()) ? String(dirs[0]).trim() : '';
                    let systemDefault = (dirs[1] && String(dirs[1]).trim()) ? String(dirs[1]).trim() : '';
                    that._showDownloadChoice(item, url, name, configured || systemDefault, systemDefault);
                });
            } else if (res && res.error) {
                layer.msg('选择失败：' + res.error, {offset:'rt', anim:'slideLeft'});
            }
        }).catch(function(e){
            layer.msg('选择失败：' + (e && e.message || e), {offset:'rt', anim:'slideLeft'});
        });
    };

    /* 实际触发下载：先把目标目录与文件名告知主进程，再点击 <a download> */
    yyMusic.prototype._doDownload = function(item, url, name, dir) {
        let that = this;
        layer.msg('正在下载《' + (item.SongName || '') + '》…', {offset:'rt', anim:'slideLeft'});
        let proceed = function() {
            let a = document.createElement('a');
            a.href = url;
            a.download = name + '.mp3';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(function(){ if (a.parentNode) a.parentNode.removeChild(a); }, 1500);
        };
        let w = window.yeyu;
        if (w && w.setDownloadTarget) {
            w.setDownloadTarget(dir || '', name).then(proceed).catch(proceed);
        } else {
            proceed();
        }
    };

	yyMusic.prototype.on = function(callback) {
		if (callback && typeof callback === "function") {
			this.callbacks.push(callback);
			return () => {
				const index = this.callbacks.indexOf(callback);
				if (index > -1) {
					this.callbacks.splice(index, 1);
				}
			};
		}
	};
	yyMusic.prototype.PlayAudio = function(option = {}) {
		let that = this;
		that.audio.currentTime = 0;
		if (!option || !option.SongUrl) {
			return false;
		}
		if (option.mid) {
		    $(that.elem).find('.curr').removeClass("curr")
			$(that.elem).find('.mid_' + option.mid).addClass('curr').siblings().removeClass("curr");
			that.data.currMid = option.mid;
			var list = that.data.playlist,
				index = list.findIndex(s => s.mid === option.mid);

			that.data.currIndex = index;
			that.callback({
				currentAudio: option
			});
			that.callback({
				currentIndex: index
			});
		}
		$(that.elem).find(".songname").text(option.SongName ? option.SongName+(option.singer?' - '+option.singer:"") : that.data.config.name);
		that.audio.loop = that.data.config.loop;
		that.audio.volume = that.data.config.volume;
		option.SongUrl && (that.audio.src = option.SongUrl);
		if(option.SongPoster){
		    $(that.elem).find('.paused').css('background-image', 'url(' + option.SongPoster + ')');
		    $(that.elem).find('.blur').css('background-image', 'url(' + option.SongPoster + ')');
		    $(that.elem).find('.playlist').css('background-image', 'url(' + option.SongPoster + ')');
		    $(that.elem).find('.albumPoster .image').css('background-image', 'url(' + option.SongPoster + ')');
		}else{
		    $(that.elem).find('.paused>i').css('font-size', 16);
		    $(that.elem).find('.blur').css('background-image', 'url(style/back.jpg)');
		    $(that.elem).find('.albumPoster .image').css('background-image', 'url(style/image.jpg)');
		    $(that.elem).find('.playlist').css('background-image', 'url(style/back.jpg)');
		}
		if(option.SongLrc){
		    $(that.elem).find(".loadLrc").empty();//清空歌词
		    that.lyricCallback(option.SongLrc);
		}else{
		    $(that.elem).find(".defaultLrc").text('暂无歌词').show();
		    $(that.elem).find(".loadLrc").hide();
		}
		if (that.data.config.autoplay == true) {
			that.play();
			document.addEventListener("WeixinJSBridgeReady", function() {
				that.play();
			}, false);
		}
		if (!that.data.playlist.some(s => s.mid === option.mid)) {
		    that.data.playlist.push(option);
		}
		that.data.currentAudio = option;
		setData("playlist", that.data.playlist);
		setData("currentAudio", that.data.currentAudio);
		setData('currMid', option.mid);
		that.renderPlayerlist();
	};

    yyMusic.prototype.PlayData = function(option, forid='defaultPlaylist') {
    	let that = this;
    	that.data[forid] = that.data[forid] || [];
    	var html = '';
    	if (type(option) === 'array') {
    		for (var i=0; i < option.length; i++) {
    			let item = option[i];
    			// 存在就跳过
    			let has = that.data[forid].findIndex(s => s.mid == item.mid) !== -1;
    			if (has || !item.mid || !item.SongUrl) {
    				continue;
    			}
    			let curr = item.mid === getData('currMid') ? 'curr' : '';
                let hasFav = that.data.myFavorites.findIndex(s => s.mid === item.mid) !== -1;
    			html += `<tr class="list_item mid_${item.mid} ${curr}">
        				<td></td>
        				<td><a data-mid="${item.mid}" title="${item.SongName}">${item.SongName}</a></td>
        				<td>${item.singer || '未知歌手'}</td>
        				<td><span class="Favorite yymc ${hasFav ? 'yymc-fav-a' : 'yymc-fav'} FavMid_${item.mid}" data-opt='${JSON.stringify(item)}'></span></td>
				<td class="download-col"><a class="downloadBtn" data-opt='${JSON.stringify(item)}' title="下载">下载</a></td>
        			</tr>`;
    			var obj = {};
    			obj.mid = item.mid;
    			obj.SongName = item.SongName;
    			obj.SongLrc = item.SongLrc?item.SongLrc:'';
    			obj.SongUrl = item.SongUrl;
    			obj.SongPoster = item.SongPoster ? item.SongPoster : '';
    			obj.singer = item.singer ? item.singer : '';
    			that.data[forid].push(obj);
    		}
    	} else if (type(option) === 'object') {
    		let has = that.data[forid].findIndex(s => s.mid == option.mid) !== -1;
    		if(has || !option.mid || !option.SongUrl) {
    			return false;
    		}
    		let curr = option.mid === getData('currMid') ? 'curr' : '';
            let hasFav = that.data.myFavorites.findIndex(s => s.mid === option.mid) !== -1;
    		html += `<tr class="list_item mid_${option.mid} ${curr}">
        			<td></td>
        			<td><a data-mid="${option.mid}" title="${option.SongName}">${option.SongName}</a></td>
        			<td>${option.singer || '未知歌手'}</td>
        			<td><span class="Favorite yymc ${hasFav ? 'yymc-fav-a' : 'yymc-fav'} FavMid_${option.mid}" data-opt='${JSON.stringify(option)}'></span></td>
				<td class="download-col"><a class="downloadBtn" data-opt='${JSON.stringify(option)}' title="下载">下载</a></td>
        		</tr>`;
    		that.data[forid].push(option);
    	} else if (isURL(option)) {
			$.get(option, function(res) {
			    var res = $.parseJSON(res);
			    if(res.code == 0){
    			    that.PlayData(res.data, forid);
			    }
    		}, "text").fail(function() {
    			layer.msg('列表加载失败', {offset: 'rt', anim: 'slideLeft'});
    		},"json");
    		return;
    	}
    	$(that.elem+' .yyMusicList .music-table[for="'+forid+'"]').find('.list_data').append(html);
    	$(that.elem+' .list_bar').find('a#'+forid).addClass('currentListBtn').siblings().removeClass("currentListBtn");
    	$(that.elem+' .music-table[for="'+forid+'"]').addClass('currentList').siblings().removeClass("currentList");
    	
    	setData('forid', forid);
    	setData(forid, that.data[forid]);
    	
    	if(that._ready && that.audio && that.audio.paused && that.data.defaultPlaylist){
    	    that.PlayAudio(getData('currentAudio') || that.data[forid][0]);
    	}
    	
    	$(function() {
    		that.data[forid] && that.callback({
    			playlist: that.data[forid]
    		});
    		$(".table-scroll .curr").length&&$(".table-scroll").animate({scrollTop:Math.max($(".table-scroll .curr").position().top - 100,0)},300);
    	});
    };
    /* 播放全部：播放当前列表中的每一首 */
    yyMusic.prototype.playAll = function() {
        let that = this;
        let $active = $(that.elem).find('.music-data-list .music-table.currentList');
        let forid = $active.length ? $active.attr('for') : 'defaultPlaylist';
        let list;
        if (forid === 'myFavorites') {
            list = getData('myFavorites') || [];
        } else {
            list = that.data[forid] || getData(forid) || [];
        }
        list = (list || []).filter(s => s && s.mid && s.SongUrl);
        if (!list.length) {
            layer.msg('当前列表为空', {offset: 'rt', anim: 'slideLeft'});
            return;
        }
        that.data.playlist = list.slice();
        setData('playlist', that.data.playlist);
        layer.msg('开始播放全部（' + list.length + ' 首）', {offset: 'rt', anim: 'slideLeft'});
        that.PlayAudio(list[0]);
    };
    /* 导入歌单：粘贴网易云歌单链接或数字 ID，导入到「默认歌单」 */
    yyMusic.prototype.importPlaylist = function() {
        let that = this;
        layer.prompt({
            title: '导入网易云歌单',
            formType: 0,
            value: '',
            btn: ['导入', '取消'],
            shadeClose: true,
            area: [yyAreaW(380), 'auto']
        }, function(val, index) {
            val = (val || '').trim();
            if (!val) { layer.msg('请输入歌单链接或ID'); return; }
            let id = that._parsePlaylistId(val);
            if (!id) { layer.msg('无法识别歌单ID，请粘贴网易云歌单链接或数字ID'); return; }
            layer.msg('正在导入歌单...', {time: 1500, offset: 'rt', anim: 'slideLeft'});
            $.get(that.apiUrl('API/'), {playlist: id}, function(res) {
                let data = (typeof res === 'string') ? $.parseJSON(res) : res;
                if (data && data.code == 0 && data.data && data.data.length) {
                    let before = (that.data.defaultPlaylist || []).length;
                    that.PlayData(data.data, 'defaultPlaylist');
                    let added = (that.data.defaultPlaylist || []).length - before;
                    layer.msg('已导入《' + (data.title || '歌单') + '》' + added + ' 首', {offset: 'rt', anim: 'slideLeft'});
                    // 切回默认歌单视图，方便直接点「播放全部」
                    $(that.elem + ' .list_bar').find('a#defaultPlaylist').addClass('currentListBtn').siblings().removeClass('currentListBtn');
                    $(that.elem + ' .music-table[for="defaultPlaylist"]').addClass('currentList').siblings().removeClass('currentList');
                } else {
                    layer.msg('歌单为空或加载失败', {offset: 'rt', anim: 'slideLeft'});
                }
            }, 'json').fail(function() {
                layer.msg('歌单加载失败，请检查网络', {offset: 'rt', anim: 'slideLeft'});
            });
            layer.close(index);
        });
    };
    /* 从链接/ID 中解析出网易云歌单数字 ID */
    yyMusic.prototype._parsePlaylistId = function(s) {
        s = (s || '').trim();
        if (/^\d+$/.test(s)) return s;
        let m = s.match(/[?&]id=(\d+)/i) || s.match(/\/playlist\/(\d+)/i) || s.match(/playlist\?id=(\d+)/i);
        if (m) return m[1];
        let m2 = s.match(/(\d{4,})/);
        return m2 ? m2[1] : '';
    };
    /* 下载设置：显示当前下载目录，支持「选择目录」「打开目录」 */
    yyMusic.prototype.settings = function() {
        let that = this;
        if (that._isAndroid()) { that._settingsAndroid(); return; }
        let html = `
        <div class="yeyu-settings" style="padding:18px 20px;min-width:320px;color:#e8e8e8;font-family:inherit;">
            <div style="font-size:15px;font-weight:600;margin-bottom:14px;">歌曲下载设置</div>
            <div style="font-size:13px;color:#bbb;margin-bottom:6px;">下载目录</div>
            <div id="yeyuDlPath" style="background:#1e1e1e;border:1px solid #333;border-radius:6px;padding:8px 10px;font-size:12px;word-break:break-all;color:#ddd;line-height:1.5;">读取中…</div>
            <div style="margin-top:14px;display:flex;gap:10px;">
                <button id="yeyuPickDir" style="flex:1;padding:8px 0;border:1px solid #2b6cff;background:#2b6cff;color:#fff;border-radius:6px;cursor:pointer;font-size:13px;">选择目录</button>
                <button id="yeyuOpenDir" style="flex:1;padding:8px 0;border:1px solid #444;background:#2a2a2a;color:#ddd;border-radius:6px;cursor:pointer;font-size:13px;">打开目录</button>
            </div>
            <div id="yeyuDlTip" style="margin-top:12px;font-size:12px;color:#888;min-height:16px;"></div>
        </div>`;
        layer.open({
            type: 1,
            title: '设置',
            area: [yyAreaW(380), 'auto'],
            shadeClose: true,
            content: html
        });
        // 读取当前已配置的目录（为空表示系统默认「下载」文件夹）
        let w = window.yeyu;
        let setPath = (p) => $('#yeyuDlPath').text(p && p.trim() ? p : '（未设置，默认：系统「下载」文件夹）');
        if (w && w.getDownloadDir) {
            w.getDownloadDir().then(setPath).catch(() => setPath(''));
        } else {
            setPath('');
        }
        // 选择目录
        $(document).off('click.yeyuDl').on('click.yeyuDl', '#yeyuPickDir', function() {
            if (!window.yeyu || !window.yeyu.pickDownloadDir) { $('#yeyuDlTip').text('当前环境不支持选择目录'); return; }
            $('#yeyuDlTip').text('请选择目录…');
            window.yeyu.pickDownloadDir().then(function(res) {
                if (res && res.path) {
                    $('#yeyuDlPath').text(res.path);
                    $('#yeyuDlTip').text('已更新下载目录，下次下载生效');
                } else if (res && res.cancelled) {
                    $('#yeyuDlTip').text('已取消');
                } else if (res && res.error) {
                    $('#yeyuDlTip').text('选择失败：' + res.error);
                }
            }).catch(function(e) { $('#yeyuDlTip').text('选择失败：' + (e && e.message || e)); });
        });
        // 打开目录
        $(document).on('click.yeyuDl', '#yeyuOpenDir', function() {
            if (!window.yeyu || !window.yeyu.openDownloadDir) return;
            window.yeyu.openDownloadDir().catch(function() {});
        });
    };
	yyMusic.prototype.play = function() {
		var that = this;
		that.audio.play();
	};
	yyMusic.prototype.pause = function() {
		this.audio.pause();
	};
	yyMusic.prototype.paused = function() {
		if (this.audio.paused) {
			this.play();
		} else {
			this.pause();
		}
	};
    yyMusic.prototype.nextPlay = function() {
    	var that = this;
    	var order = that.data.order;
    
    	var list = that.data.playlist || getData('playlist') || [];
		var index = list.findIndex(s => s.mid === getData('currMid'));
    	if (!list.length) return false;
    
    	if (order === 1) {
    		that.PlayAudio(that.data.currentAudio);
    		return false;
    	} else if (order === 2) {
    		index++;
    		if (index >= list.length) {
    			index = 0;
    		}
    		that.PlayAudio(list[index]);
    	} else if (order === 3) {
    		let currentIdx = list.findIndex(s => s.mid === that.data.currentAudio.mid);
    		let rnd;
    		do {
    			rnd = Math.floor(Math.random() * list.length);
    		} while (list.length > 1 && rnd === currentIdx);
    		that.data.currIndex = rnd;
    		that.PlayAudio(list[rnd]);
    	}
    };
	yyMusic.prototype.AudioEvent = function() {
		var that = this;
    	win.addEventListener('hashchange', () => {
    		that.Refresh();
    	})
		that.audio.addEventListener("play", function(e) {
			$(that.elem).find("a.paused").find("i").addClass("yymc-pause").removeClass("yymc-play");
			that.callback({
				state: "play"
			});
		});
		that.audio.addEventListener("pause", function(e) {
			$(that.elem).find("a.paused").find("i").addClass("yymc-play").removeClass("yymc-pause");
            layer.msg('已暂停', {offset: 'rt', anim: 'slideLeft'});
			that.callback({
				state: "pause"
			});
		});
		that.audio.addEventListener("ended", function() {
			that.nextPlay();
            layer.msg('播放完成，切换下一首', {offset: 'rt', anim: 'slideLeft'});
			that.callback({
				state: "ended"
			});
		});
		// 播放失败（歌曲下架 / 取不到音源 / 网络中断）：自动跳下一首，
		// 连续失败多首则停下提示，避免无限快速切歌
		that.audio.addEventListener("error", function() {
			that._failCount = (that._failCount || 0) + 1;
			if (that._failCount >= 3) {
				that._failCount = 0;
				layer.msg('连续多首无法播放，请检查网络后重试', {offset: 'rt', anim: 'slideLeft'});
				return;
			}
			layer.msg('该歌曲暂时无法播放，自动切换下一首', {offset: 'rt', anim: 'slideLeft'});
			setTimeout(function() {
				that.nextPlay();
			}, 900);
		});
		that.audio.addEventListener("loadedmetadata", function() {
			that._failCount = 0;
			// 网易云对版权/付费歌曲在未授权时只给 30 秒试听片段，这里明确提示，
			// 避免用户误以为是软件故障
			if (that.audio.duration > 0 && that.audio.duration < 31) {
				layer.msg('此曲仅有 30 秒试听（版权限制）', {offset: 'rt', anim: 'slideLeft'});
			}
		});
		that.audio.addEventListener("durationchange", function() {
			$(that.elem).find(".duration").text(formatTime(that.audio.duration));
			that.callback({
				duration: that.audio.duration
			});
		});
		that.audio.addEventListener("timeupdate", function() {
			that.callback({
				currentTime: that.audio.currentTime
			});
			var currentTime = formatTime(that.audio.currentTime);
			$(that.elem).find(".currentTime").text(currentTime);
			$(that.elem).find(".progress").css("width", that.audio.currentTime / that.audio.duration * 100 + "%");
			that.data.lyric && that.scrollLyric(that.audio.currentTime);
		});
		$(document).on("click", that.elem + " .paused", function() {
			if (that.audio.paused) {
				that.play();
			} else {
				that.pause();
			}
		});
		$(document).on("click", that.elem + " .nextPlay", function() {
			that.nextPlay();
		});
		$(document).on("click", that.elem + " .lrcline", function() {
			var time = $(this).attr("data-time");
			that.audio.currentTime = time;
		});
        $(document).on("click", that.elem + " .yyMusicList .list_item a", function() {
            if ($(this).hasClass('downloadBtn')) return;
            var forid = $(this).parents('.music-table').attr('for');
            var mid = $(this).attr("data-mid");
            var list;
            if(forid === 'myFavorites'){
                list = getData('myFavorites') || [];
            }else{
                list = that.data[forid];
            }
            var i = list.findIndex(s => s.mid == mid);
            var opt = list[i];
            that.PlayAudio(opt);
            that.play();
        });
		$(document).on("click", that.elem + " .songlist", function() {
			if ($(that.elem).find('.playlist').css('display') == 'none') {
				$(that.elem).find('.playlist').fadeIn();
			} else {
			    $(that.elem).find('.playlist').fadeOut();
			}
		});
		$(document).on("click", that.elem + " .playlist .shade", function() {
            $(that.elem).find('.playlist').fadeOut();
		});
		$(document).on("click", that.elem + " .songlrc", function() {
			if ($(that.elem).find('.yyMusicLrc').css('display') == 'none') {
				$(that.elem).find('.yyMusicLrc').fadeIn();
				$(that.elem).find('.yyMusicList').css('opacity', 0);
			} else {
			    $(that.elem).find('.yyMusicLrc').fadeOut();
				$(that.elem).find('.yyMusicList').fadeTo(500, 1);
			}
		});
		$(document).on("click", that.elem + " .playlistData .list_item a", function() {
			if ($(this).hasClass('downloadBtn')) return;
			var mid = $(this).attr("data-mid");
			var plist = that.data.playlist;
			var i = plist.findIndex(s => s.mid == mid);
			var opt = plist[i];
			that.PlayAudio(opt);
			that.play();
		});
		$(document).on("click", that.elem + " .order", function() {
		    var order = that.data.order;
		    var msg = '';
			if(order === 1){
			    order = 2;//循环
			    msg = '列表循环';
			    $(that.elem).find('.order').find('i').removeClass().addClass('yymc yymc-normal').attr('title', msg);
			}
			else if(order === 2){
			    order = 3;//随机
			    msg = '随机播放';
			    $(that.elem).find('.order').find('i').removeClass().addClass('yymc yymc-random').attr('title', msg);
			}
			else if(order === 3){
			    order = 1;//单曲
			    msg = '单曲循环';
			    $(that.elem).find('.order').find('i').removeClass().addClass('yymc yymc-repeat').attr('title', msg);
			}
			that.data.order = order;
            setData("order", order);
            layer.msg('已切换到 [ '+msg+' ] ', {offset: 'rt', anim: 'slideLeft'});
		});
        $(document).on("click", that.elem + " .list_bar a", function() {
            var forid = $(this).attr('id');
            // 播放全部 / 导入歌单 由各自处理器处理，避免被当成列表标签切换
            if(forid === 'playAll' || forid === 'importPlaylist') return;
            if(forid === 'myFavorites'){
                let favList = getData('myFavorites') || [];
                let $tbody = $(that.elem+' .music-table[for="myFavorites"] .list_data');
                $tbody.empty();
                let html = '';
                favList.forEach(item=>{
                    if(!item.mid || !item.SongUrl) return;
                    let curr = item.mid === getData('currMid') ? 'curr' : '';
                    html += `<tr class="list_item mid_${item.mid} ${curr}">
                        <td></td>
                        <td><a data-mid="${item.mid}" title="${item.SongName}">${item.SongName}</a></td>
                        <td>${item.singer || '未知歌手'}</td>
                        <td><span class="Favorite yymc yymc-fav-a FavMid_${item.mid}" data-opt='${JSON.stringify(item)}'></span></td>
				<td class="download-col"><a class="downloadBtn" data-opt='${JSON.stringify(item)}' title="下载">下载</a></td>
                    </tr>`;
                })
                $tbody.html(html);
                $(that.elem+' .list_bar').find('a#'+forid).addClass('currentListBtn').siblings().removeClass("currentListBtn");
                $(that.elem+' .music-table[for="'+forid+'"]').addClass('currentList').siblings().removeClass("currentList");
                setData('forid', forid);
                return;
            }
            var listdata = getData(forid);
            that.PlayData(listdata, forid);
        });
		$(document).on("click", that.elem + " .addPlaylist", function() {
            layer.prompt({title: '输入歌单ID导入'}, function(value, index, elem){
                if(value === '') return elem.focus();
        			$.get(that.apiUrl('API/'), {playlist:value}, function(res) {
        			    var res = $.parseJSON(res);
        			    if(res.code == 0){
            			    var myPlaylist = res.data;
            				that.PlayData(myPlaylist, 'myPlaylist');
            				setData('myPlaylist', myPlaylist);
            				layer.msg('歌单导入成功', {offset: 'rt', anim: 'slideLeft'});
        			    }
        			}, "text").fail(function() {
        				layer.msg('列表加载失败', {offset: 'rt', anim: 'slideLeft'});
        			},"json");
                layer.close(index);
            });
		});
		$(document).on("click", that.elem + " .playAllBtn", function() {
            that.playAll();
        });
		$(document).on("click", that.elem + " .importBtn", function() {
            that.importPlaylist();
        });
		$(document).on("click", that.elem + " #settingsBtn", function() {
            that.settings();
        });
		$(document).on("click", that.elem + " .downloadBtn", function(e) {
            e.preventDefault();
            var raw = $(this).attr('data-opt');
            var item = null;
            try { item = $.parseJSON(raw); } catch (err) { item = null; }
            if (!item || !item.SongUrl) { layer.msg('暂无下载地址', {offset:'rt', anim:'slideLeft'}); return; }
            that.downloadSong(item);
        });
		$(document).on("click", that.elem + " .Favorite", function() {
		    var option = $(this).attr('data-opt');
            that.favorite($.parseJSON(option));
		});
		$(document).on("click", that.elem + " [act='PlayAudio']", function() {
		    var option = $(this).attr('data-opt');
            that.PlayAudio($.parseJSON(option));
		});
        $(document).on('submit', that.elem + " #search",function(e){
            e.preventDefault();
            let value = $(that.elem + " #keyword").val().trim();
            if(value === '') return elem.focus();
			$.get(that.apiUrl('API/'), {key:value}, function(res) {
			    var res = $.parseJSON(res);
			    if(res.code == 0){
    			    var searchList = res.data;
    			    $(that.elem).find('.music-table[for="searchList"] .list_data').empty();
    				that.PlayData(searchList, 'searchList');
			    }
			}, "text").fail(function() {
				layer.msg('列表加载失败', {offset: 'rt', anim: 'slideLeft'});
			},"json");
            return false;
        })
		$(document).on("click", that.elem + " .searchBtn i.submit", function() {
            var value = $(that.elem + " .searchBtn input").val();
            if(value === '') return elem.focus();
			$.get(that.apiUrl('API/'), {key:value}, function(res) {
			    var res = $.parseJSON(res);
			    if(res.code == 0){
    			    var searchList = res.data;
    			    $(that.elem).find('.music-table[for="searchList"] .list_data').empty();
    				that.PlayData(searchList, 'searchList');
			    }
			}, "text").fail(function() {
				layer.msg('列表加载失败', {offset: 'rt', anim: 'slideLeft'});
			},"json");
		});
	};
	yyMusic.prototype.parseLyric = function(lrc) {
		var that = this;
		if (lrc === "") return "";
		var lyrics = lrc.split("\n");
		var lrcObj = {};
		for (var i = 0; i < lyrics.length; i++) {
			var lyric = decodeURIComponent(lyrics[i]);
			var timeReg = /\[\d*:\d*((\.|\:)\d*)*\]/g;
			var timeRegExpArr = lyric.match(timeReg);
			if (!timeRegExpArr) continue;
			var clause = lyric.replace(timeReg, "");
			lrcObj[0] = that.data.config.name;
			for (var k = 0,
					h = timeRegExpArr.length; k < h; k++) {
				var t = timeRegExpArr[k];
				var min = Number(String(t.match(/\[\d*/i)).slice(1)),
					sec = Number(String(t.match(/\:\d*/i)).slice(1));
				var time = min * 60 + sec;
				lrcObj[time] = clause;
			}
		}
		return lrcObj;
	};
	yyMusic.prototype.lrcHtml = function(lrcText) {
		var that = this;
		if (lrcText == ''){
		    that.data.lyric = '[00:00:00] 暂无歌词';
		    return false;
		}
		that.data.renum = 0;
		that.data.lyric = that.parseLyric(lrcText);
		if (that.data.lyric === "") {
			return false;
		}
		that.callback({
			lrcText: that.data.lyric
		});
		$(that.elem).find(".loadLrc").empty();
		$(that.elem).find(".lrcText").scrollTop(0);
		that.data.lastLyric = -1;
		var i = 0;
		for (var k in that.data.lyric) {
			var txt = that.data.lyric[k];
			if (!txt) txt = '《'+that.data.config.name+'》';
			var li = $("<li data-time='" + k + "' data-no='" + i + "' class='lrcline' title='跳转到 [" + formatTime(k) + "]'>" + txt + "</li>");
			$(that.elem).find(".loadLrc").append(li);
			i++;
		}
		$(that.elem).find(".defaultLrc").hide();
		$(that.elem).find(".loadLrc").show();
	};
	yyMusic.prototype.lyricCallback = function(str) {
		var that = this;
		$(that.elem).find(".defaultLrc").show();
		$(that.elem).find(".loadLrc").hide();
		if (!isURL(str)) {
			that.lrcHtml(str);
		} else {
			$.get(str, function(lrcText) {
				that.lrcHtml(lrcText);
			}, "text").fail(function() {
				$(that.elem).find(".defaultLrc").text("歌词加载失败").show();
			});
		}
	};
	yyMusic.prototype.scrollLyric = function(time) {
		var that = this;
		if (that.data.lyric === "") return false;
		time = parseInt(time);
		if (that.data.lyric === undefined || that.data.lyric[time] === undefined) return false;
		if (that.data.lastLyric == time) return true;
		var i = 0;
		for (var k in that.data.lyric) {
			if (k == time) break;
			i++;
		}
		that.data.lastLyric = time;
		$(that.elem).find(".lrcline[data-no='" + i + "']").addClass("currline").siblings().removeClass("currline");
		var scroll = $(that.elem).find(".loadLrc").children().height() * i - ($(that.elem).find('.lrcText').height() / 2 - $(that.elem).find(".currline").prev().height() - 15);
		$(that.elem).find(".lrcText").stop().animate({
			scrollTop: scroll
		}, 500);
		that.callback({
			currentLyric: $(that.elem).find(".lrcline[data-no='" + i + "']").html()
		});
	}
		/* ===== 移动端（Capacitor/Android）扩展 ===== */
	/* 规范化服务器地址：去尾部斜杠；用户只填 IP/域名时自动补 http:// */
	function yyNormBase(v) {
		let b = (v || '').trim().replace(/\/+$/, '');
		if (!b) return '';
		if (!/^[a-zA-Z][a-zA-Z0-9+.\-]*:\/\//.test(b)) b = 'http://' + b;
		return b;
	}
	window.yyNormBase = yyNormBase;
	/* 弹窗宽度：不超过屏幕宽度（手机竖屏也能完整显示） */
	function yyAreaW(max) {
		let vw = window.innerWidth || document.documentElement.clientWidth || 375;
		return Math.max(260, Math.min(max, vw - 24)) + 'px';
	}
	window.yyAreaW = yyAreaW;
	yyMusic.prototype.apiRoot = function() {
		return yyNormBase(localStorage.getItem('yy_api_base'));
	};
	yyMusic.prototype.apiUrl = function(p) {
		let b = this.apiRoot();
		if (!b) return (p.charAt(0)==='/' ? '.'+p : './'+p);
		return b + '/' + p.replace(/^(\.\/)+/,'');
	};
	yyMusic.prototype._isAndroid = function() {
		return !!(window.Capacitor);
	};
	yyMusic.prototype._arrayBufferToBase64 = function(buffer) {
		let binary = '';
		const bytes = new Uint8Array(buffer);
		const len = bytes.byteLength;
		for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); }
		return window.btoa(binary);
	};
	yyMusic.prototype._downloadAndroid = function(item) {
		let that = this;
		let url = item.SongUrl;
		let name = (item.SongName || 'song').replace(/[\\/:*?"<>|\n\r\t]/g,'_').slice(0,80);
		if (!url) { layer.msg('暂无下载地址',{offset:'rt',anim:'slideLeft'}); return; }
		let cap = window.Capacitor;
		let FS = cap && cap.Plugins && cap.Plugins.Filesystem;
		if (!FS) {
			layer.confirm('当前环境不支持直接下载，是否用浏览器打开歌曲？',{title:'下载',btn:['打开','取消']}, function(i){ layer.close(i); window.open(url,'_blank'); });
			return;
		}
		layer.confirm('下载《'+(item.SongName||'')+'》到手机存储？',{title:'歌曲下载',btn:['下载','取消']}, function(idx){
			layer.close(idx);
			layer.msg('正在下载…',{offset:'rt',anim:'slideLeft'});
			fetch(url).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.arrayBuffer(); })
				.then(function(buf){
					let b64 = that._arrayBufferToBase64(buf);
					return FS.writeFile({ path: name+'.mp3', data: b64, directory: 'DOCUMENTS', recursive: true });
				})
				.then(function(){ layer.msg('已保存：'+name+'.mp3（手机存储/Documents）',{offset:'rt',anim:'slideLeft'}); })
				.catch(function(e){ layer.msg('下载失败：'+(e&&e.message||e),{offset:'rt',anim:'slideLeft'}); });
		});
	};
	yyMusic.prototype._settingsAndroid = function() {
		let that = this;
		let cur = (localStorage.getItem('yy_api_base')||'').trim();
		let html = `
		<div class="yeyu-settings" style="padding:18px 20px;min-width:320px;color:#e8e8e8;font-family:inherit;">
			<div style="font-size:15px;font-weight:600;margin-bottom:6px;">服务器设置</div>
			<div style="font-size:12px;color:#999;margin-bottom:10px;line-height:1.7;">填 <b>API 目录的上一级</b>，App 会自动拼 <code>/API/</code>。<br>例：<code>http://8.218.229.136</code> 或 <code>https://你的域名/yyMusic</code><br>只填 IP 也行，会自动补 <code>http://</code>。</div>
			<div style="font-size:13px;color:#bbb;margin-bottom:6px;">API 服务器地址</div>
			<input id="yeyuApiBase" value="${cur}" placeholder="http://8.218.229.136" style="width:100%;box-sizing:border-box;padding:9px 10px;border:1px solid #333;border-radius:6px;background:#1e1e1e;color:#ddd;font-size:13px;" />
			<div style="margin-top:12px;display:flex;gap:10px;">
				<button id="yeyuSaveApi" style="flex:1;padding:9px 0;border:1px solid #2b6cff;background:#2b6cff;color:#fff;border-radius:6px;cursor:pointer;font-size:13px;">保存</button>
				<button id="yeyuTestApi" style="flex:1;padding:9px 0;border:1px solid #444;background:#2a2a2a;color:#ddd;border-radius:6px;cursor:pointer;font-size:13px;">测试连接</button>
			</div>
			<div id="yeyuApiTip" style="margin-top:12px;font-size:12px;color:#888;min-height:16px;"></div>
			<div style="margin-top:14px;font-size:12px;color:#777;line-height:1.6;">歌曲下载保存在手机存储的 Documents 目录（应用私有）。</div>
		</div>`;
		layer.open({ type:1, title:'设置', area:[yyAreaW(380),'auto'], shadeClose:true, content:html });
		$('#yeyuSaveApi').off('click').on('click', function(){
			let v = yyNormBase($('#yeyuApiBase').val());
			if (!v) { $('#yeyuApiTip').text('请先填写地址'); return; }
			localStorage.setItem('yy_api_base', v);
			$('#yeyuApiTip').text('已保存：' + v + '，正在刷新…');
			setTimeout(function(){ location.reload(); }, 800);
		});
		$('#yeyuTestApi').off('click').on('click', function(){
			let v = yyNormBase($('#yeyuApiBase').val());
			if(!v){ $('#yeyuApiTip').text('请先填写地址'); return; }
			let url = v + '/API/?key=' + encodeURIComponent('周杰伦');
			$('#yeyuApiTip').text('测试中：' + url);
			$.ajax({ url: url, dataType: 'json', timeout: 15000 })
				.done(function(res){
					let ok = res && (res.result || res.code || res.data || res.song_list || res.songs);
					$('#yeyuApiTip').text(ok ? '连接成功 ✓ 请点「保存」' : '已连通，但返回空数据（检查 API 是否正常 / Cookie 是否有效）');
				})
				.fail(function(xhr, st){
					let code = xhr && xhr.status;
					let tip = '连接失败：' + (st || 'error') + (code ? '（HTTP ' + code + '）' : '');
					if (!code) tip += ' 网络不通：手机无法访问该地址，或 http/https 不匹配';
					else if (code === 404) tip += ' 路径不存在：API 未上传到该目录';
					else if (code === 403) tip += ' 被拒绝：服务器目录权限或 nginx 规则限制';
					else if (code >= 500) tip += ' 服务器错误：PHP 报错或无法执行 PHP';
					$('#yeyuApiTip').text(tip);
				});
		});
	};
	/* 移动端初始化引导：未配置服务器地址时自动弹设置；已配置则做一次连通性自检 */
	yyMusic.prototype._androidSetupCheck = function() {
		let that = this;
		if (!that._isAndroid()) return;
		if (!that.apiRoot()) {
			setTimeout(function(){ try { that.settings(); } catch(e){} }, 700);
			return;
		}
		// 已配置地址：启动时自检一次，连不上就明确告知原因并引导修改
		setTimeout(function(){
			let base = that.apiRoot();
			let url = base + '/API/?key=' + encodeURIComponent('周杰伦');
			$.ajax({ url: url, dataType: 'json', timeout: 12000 })
				.done(function(res){
					let ok = res && (res.result || res.code || res.data || res.song_list || res.songs);
					if (!ok) {
						layer.msg('服务器已连通，但返回数据异常，请检查 API 与 Cookie', {offset:'rt', anim:'slideLeft', time:4000});
					}
				})
				.fail(function(xhr, st){
					let code = xhr && xhr.status;
					let reason = code ? ('HTTP ' + code) : (st === 'timeout' ? '请求超时' : '网络不通');
					let hint = '';
					if (!code) hint = '手机无法访问该地址（IP 填错 / 服务器未开机 / 防火墙拦截）';
					else if (code === 404) hint = '路径不存在 —— API 还没上传到该目录';
					else if (code === 403) hint = '服务器拒绝访问（目录权限或 nginx 规则）';
					else if (code >= 500) hint = '服务器 PHP 报错或未启用 PHP';
					else if (code === 0) hint = '请求被拦截（http/https 不匹配）';
					layer.confirm(
						'<div style="font-size:14px;color:#e8e8e8;line-height:1.7;">连接失败：' + reason + '</div>'
						+ '<div style="font-size:12px;color:#9fc;margin-top:6px;word-break:break-all;">' + base + '/API/</div>'
						+ '<div style="font-size:12px;color:#aaa;margin-top:8px;line-height:1.6;">' + hint + '</div>',
						{ title: '无法连接到服务器', btn: ['去设置', '取消'] },
						function(i){ layer.close(i); that.settings(); }
					);
				});
		}, 900);
	};
	window.yyFullApi = function(p){
		var b = yyNormBase(localStorage.getItem('yy_api_base'));
		if(!b) return (p.charAt(0)==='/' ? '.'+p : './'+p);
		return b + '/' + p.replace(/^(\.\/)+/,'');
	};
	win.yyMusic = yyMusic;
}(window);