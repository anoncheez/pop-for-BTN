/**
 * Created by cheezburgah on 9/02/15.
 */
var scrapePage = function(torrents, store){

    var getEpisodeName = function(object){
        return $(object).find('a.episode').text();
    };

    var getSeasonOfEpisode = function(object){
        return $(object).parent().parent().find('tr.colhead_dark').find('strong').text();
    };

    var getSeasonName = function(object){
        return $(object).find('a.season').text();
    };

    var getYear = function(object){
        return $(object).find('div.year').text();
    };

    var isEpisode = function(str){
        return /^S[\d]{2,3}E[\d]{2,3}$/.test(str);
    };

    var isSeason = function(str){
        return /^Season [\d]+(.\d)?$/.test(str);
    };

    var isExtra = function(str){
        return /^Season [\d]+(.\d)?[\w\d\s]+$/.test(str);
    };

    /**
     * @param object -> the btn .group_torrent
     * @returns {number} -> 1 = first torrent in episode, 2 = first torrent in season,
     * -1 an episode/season but not the first
     */
    var determineJob = function(object){
        var title;
        title = getEpisodeName(object);
        if(isEpisode(title))
            return 0;
        title = getSeasonName(object)
        if(isSeason(title))
            return 1;
        if(isExtra(title))
            return 2;
        return -1;
    };

    /**
     * @param store -> where to store the data (must be initilized array)
     * @param obj -> the btn .group_torrent you want to scrape
     * @param key -> the current key to store under
     * @param id -> the current id to store under
     * @param first -> if its the first in its category
     */
    var store_episode = function(store, obj, key, id, first){
        var input = {};
        var fix;
        if(!first) fix = 1; else fix = 0;
        var links = $(obj).find('a').toArray();
        var numbers = $(obj).find('.number').toArray();
        input['episode'] = id; //duplication of data but makes things easier when sorting later...
        input['dl'] = $(links[1-fix]).attr('href');
        input['torrent_link'] = $(links[2-fix]).attr('href');
        input['quality'] = $(links[2-fix]).text();
        input['size'] = $(numbers[0]).text();
        input['seeds'] = $(numbers[2]).text();
        input['leechers'] = $(numbers[3]).text();
        input['snatches'] = $(numbers[1]).text();
        store[key][id].push(input);
    };

    var scrape = function(torrents, store) {
        for (var i = 0; i < torrents.length; i++) {
            var obj = torrents[i];
            var curr_key, curr_id;
            switch (determineJob(obj)) {
                case 0:
                    // the torrents following this are airing episodes
                    curr_key = getSeasonOfEpisode(obj);
                    curr_id = getEpisodeName(obj);
                    if (store[curr_key] === undefined) store[curr_key] = {};
                    if(store[curr_key]["year"] === undefined) store[curr_key]["year"] = getYear(obj);
                    store[curr_key][curr_id] = [];
                    store[curr_key][curr_id]["link"] = $(obj).find('a').attr('href');
                    store_episode(store, obj, curr_key, curr_id, true);
                    break;
                case 1:
                    // the torrents following this are a completed seasons
                    curr_key = getSeasonName(obj);
                    curr_id = "pack";
                    if (store[curr_key] === undefined) store[curr_key] = {};
                    if(store[curr_key]["year"] === undefined) store[curr_key]["year"] = getYear(obj);
                    store[curr_key][curr_id] = [];
                    store_episode(store, obj, curr_key, curr_id, true);
                    break;
                case 2:
                    // the torrents following this are extras
                    curr_key = "extra";
                    curr_id = getSeasonName(obj);
                    if (store[curr_key] === undefined) store[curr_key] = {};
                    store[curr_key][curr_id] = [];
                    store_episode(store, obj, curr_key, curr_id, true);
                    break;
                default:
                    // either a season or an episode but belong in prev detected category
                    store_episode(store, obj, curr_key, curr_id, false);
                    break;
            }
        }
    };

    scrape(torrents, store);

};

var generatePage = function(store, settings){

    var generateHead = function(){
        $( ".main_column" ).prepend( "<div class='pop pure-g'>" );
    };

    var generateMenu = function(store){
        var dom = "<div id='season_menu'>";
        for(var key in store){
            dom += "<button class='button-large pure-button'>" + key + "</button>";
        }
        dom += "</div>";
        $(".pop").append(dom);
    };

    var generateSeasons = function(store, settings){

        var generateSeason = function(store, key, settings){

            var rearrangeData = function(store, quality_store){
                $.map(store, function(obj, episode_num){
                    if(episode_num!="year") {
                        $.map(obj, function (torrent, torrent_num) {
                            if (quality_store[store[episode_num][torrent_num].quality] === undefined) quality_store[store[episode_num][torrent_num].quality] = [];
                            quality_store[store[episode_num][torrent_num].quality].push(torrent);
                        });
                    }
                });
            };

            var filterQualities = function(quality_store, settings){
                for(var quality in quality_store){
                    $.map(settings, function(val, i ) {
                        if(quality.indexOf(i) > 0 && val=='false'){
                            delete(quality_store[quality]);
                        }
                    });
                }
            };

            var createQualityDropdowns = function(quality_store){

                var createQualityDropdown = function(object, key){
                    var dom = "<div class='quality_group'>";
                    dom += "<div class='quality_heading'>" + key + "</div>"
                    dom += "<div class='pop_info pure-g'>" +
                    "<div class='pure-u-2-5 center'>Episode</div> " +
                    "<div class='pure-u-1-5 center'>Snatches</div> " +
                    "<div class='pure-u-1-5 center'>Seeds</div> " +
                    "<div class='pure-u-1-5 center'>Download</div> " +
                    "</div>";
                    for(var episode in object) {
                        dom += "<div class='pop_torrent pure-g'> " +
                        "<div class='pure-u-2-5 center'>" + object[episode].episode + "</div> " +
                        "<div class='pure-u-1-5 center'>" + object[episode].snatches + "</div> " +
                        "<div class='pure-u-1-5 center'>" + object[episode].seeds + "</div> " +
                        "<div class='pure-u-1-5 center'><a class='download' href='" + object[episode].dl + "'>DL</a></div> " +
                        "</div>";
                    }

                    dom += "<div class='download_all_div center'><a class='download_all pure-button pure-button-primary'>Download all in this quality</a></div>";
                    dom += "</div>";
                    return dom;
                };

                for(var key in quality_store){
                    dom += createQualityDropdown(quality_store[key], key);
                }
            };

            var quality_store = {};
            var dom = "<div id='" + key + "' class='season_div'>";
            rearrangeData(store, quality_store);
            filterQualities(quality_store, settings);
            createQualityDropdowns(quality_store);
            dom += "</div>";
            return dom;
        };

        var dom = "";

        for(var key in store){
            dom += generateSeason(store[key], key, settings);
        }

        dom += "<div class='padding'></div>";

        $(".pop").append(dom);
    };


    var generate = function(store, settings) {
        generateHead();
        generateMenu(store);
        generateSeasons(store, settings);
        //too unstable at the moment to hide original layout
        //$("table.torrent_table").hide();
    };

    generate(store, settings);
};

var getSettings = function(cb) {
    chrome.runtime.sendMessage({action: "all"}, function(response) {
        cb(response);
    });
};


var execute = function() {
    chrome.runtime.onMessage.addListener(function(msg,sender){
        if(msg.action === 'refresh')
            location.reload(true);
        return false;
    });

    var store = {};
    var torrents = $('tr.group_torrent').toArray();
    scrapePage(torrents, store);
    getSettings(function(settings) {
        generatePage(store, settings);
        (function() {
            $('.quality_heading').on('click', function () {
                $(this).parent().find('.pop_torrent, .pop_info, .download_all').each(function(){$(this).toggle();});
            });
            $('.download_all').on('click', function() {
                var download_links = $(this).parent().parent().find('a.download').toArray();
                for(var link in download_links){
                    window.open(download_links[link]);
                }
            });
            $('#season_menu button').on('click', function(){
                $('#season_menu button').removeClass('pure-button-active');
                $(this).addClass('pure-button-active');
                $('.season_div').hide();
                var season_to_show = '#' + $(this).text();
                season_to_show = season_to_show.replace(' ', '\\ ');
                $(season_to_show).show();
            });
            var default_season = $('#season_menu button:first');
            $(default_season).click();
        })();
    });
};



execute();
