var v = url_vers();
Vue.component('v-select', VueSelect.VueSelect);
var app = new Vue({
    el: '#app',
    data: {
        all_vers: [], // all available version
        selected_vers: v.vers, // selected version
        selected_vers2: [], // versions for display
        all_parameters: [], // all parameter name for selected version
        parameters: {}, // parameters[version][name] = value
        difference: {}, // difference[name][version] = true if the parameter value is different from the previous version
        only_difference: v.diff, // show only difference parameters
        // add options
        selected_opts: v.opts,
        currentSelectListOptions: [],
        // 2024-02-26, add for enable cross choose.
        waitFlag:false,
        n: 0,
        lists: [ // 可以有很多条数据 // 数组对象的形式
            {
                title: 'mysqld',
                path: './json-mysqld/mysqld.json'
            },
            {
                title: 'mysql',
                path: './json-mysql/mysql.json'
            },
            {
                title: 'mariadbd',
                path: './json-mariadbd/mariadbd.json'
            },
            {
                title: 'mariadb',
                path: './json-mariadb/mariadb.json'
            },
            {
                title: 'mariadb-dump',
                path: './json-mariadb-dump/mariadb-dump.json'
            }
        ]
    },
    methods: {
        change_opts(title) {
            app.selected_opts = title;
            // 2024-02-26, remove for enable cross choose.
//            if(app.selected_vers) {
//                app.selected_vers = [];
//            }
//            if(app.selected_vers2) {
//                app.selected_vers2 = [];
//            }
//            if(app.all_parameters) {
//                app.all_parameters = [];
//            }
            set_url();
            url_vers();
//            console.log("m:change_opts:",app.selected_opts,app.currentSelectListOptions)
        },
        version_selected: function(event) {
        // 2024-02-26, add for enable cross choose.
//            get_version_params(app.selected_vers)
            get_version_params(app.selected_vers ,app.selected_opts)
                .then(function() {
                    app.selected_vers2 = app.selected_vers.concat(); // dup
//                    console.log("version_selected:",app.selected_vers2)
                    set_url();
                    url_vers();
                })
        },
        change_diff: function(event) {
            set_url();
            url_vers();
        },
        row_class: function(name) {
            var klass = {};
            if(app.only_difference) {
                var f = !!app.difference[name];
                klass.display = f;
                klass.undisplay = !f;
            } else {
                klass.display = true;
                klass.undisplay = false;
            }
            return klass;
        },
        col_class: function(name, ver) {
            return {
                "parameter-value": true,
                difference: app.difference[name] && app.difference[name][ver],
                // 2024-02-26, add for enable cross choose.
//                unexist: app.parameters[ver] && app.parameters[ver][name] == undefined
                unexist: app.parameters[ver]['data'] && app.parameters[ver]['data'][name] == undefined
            }
        },
        title_class: function(opts) {
            var klass = '';
            var filePathIndex = this.lists.findIndex((element) => element.title == opts);
//            console.log("m:title_class:",klass,filePathIndex,this.selected_opts)
            if(this.selected_opts == opts) {
                klass = 'active';
            } else {
                klass = '';
            }
            return klass;
        },
        // add options, load json-mysql/mysql.json
        getJsonData(opts) {
            var filePath = this.lists.find((element) => element.title == opts).path;
//            console.log("m:getJsonData:",opts,filePath)

            axios.get(filePath,{async:false})
                .then(function(response) {
                    if(!this.currentSelectListOptions){
                        this.currentSelectListOptions = [];
                    }
//                    console.log("getJsonData:currentSelectListOptions",this.currentSelectListOptions)
//                    console.log("getJsonData:response",response)

                    if(app.only_difference) {
                        app.difference = v.diff;
                    }
                    Object.keys(response.data)
                        .forEach(key => {
                            this.currentSelectListOptions.push({
                                "key": key,
                                "type": opts,
                                "path": response.data[key]
                            })
                        });
                    app.all_vers = Object.keys(response.data);
                    if(app.selected_vers && app.selected_vers != '' && app.selected_vers.length > 0){
                        app.selected_vers2 = app.selected_vers;
                        get_version_params(app.selected_vers,opts);
                    }
                })
        }
    },
    mounted: function() {
//        console.log("mounted:getJsonData -->",this.selected_opts)
// 2024-02-26, add for enable cross choose.
//        this.getJsonData(this.selected_opts);
        if(typeof this.selected_opts === "string"){
             this.getJsonData(this.selected_opts);
        }else{
         var copy_selected_opts = this.selected_opts.concat()
                if(copy_selected_opts.length >1){
                     copy_selected_opts.forEach(i=>{
                     this.getJsonData(i);
                  })
//                this.selected_opts=copy_selected_opts[0]
                }else{
                    this.getJsonData(this.selected_opts[0]);
                }
        }
    }
});

//console.log("app -->",app)

function get_params(ver,ops) {
    let filePath = '';
//    let filePath = `json-mysqld/mysqld-${ver}.json`
    this.currentSelectListOptions.forEach(item => {
        if(item.key == ver && item.type == ops) {
            filePath = item.path;
            return
        }
    });
//    console.log("f:get_params -->","ver:",ver,",","filePath:",filePath)
    return axios.get(filePath,{async:false})
        .then(function(response) {
//            app.parameters[ver] = response.data;
            if(typeof response.data == "string"){
               return
            }
            if(ops){
               app.parameters[ver] = {data:response.data,type:ops};
            }else{
               app.parameters[ver] = {data:response.data,type:app.selected_opts};
            }
            app.$forceUpdate();
        })
};

async function get_version_params(vers,ops) {
    var all_params = [];
    var difference = {};
    for(var ver of vers) {
        if(!app.parameters[ver]) {
            await get_params(ver,ops);
        }
        if(app.parameters[ver]){
            all_params = all_params.concat(Object.keys(app.parameters[ver]["data"]));
        }
    }
    all_params = Array.from(new Set(all_params)).sort(); // unique & sort
    for(var i = 1; i < vers.length; i++) {
        var ver = vers[i];
        for(var name of all_params) {
            if(app.parameters[vers[i - 1]]["data"][name] != app.parameters[ver]["data"][name]) {
                if(!difference[name]) {
                    difference[name] = {};
                }
                difference[name][ver] = true;
            }
        }
    }
    app.all_parameters = all_params;
    app.difference = difference;
//    console.log("get_version_params -->",vers)
};

function set_url() {
    var opts = app.selected_opts;
    var vers = app.selected_vers.join(',');
    var diff = app.only_difference;
    var v = url_vers();
    if(opts == v.opts && vers == v.vers.toString() && diff == v.diff) {
        return;
    }

    var qs = [];
    if(opts) {
    // 2024-02-26, add for enable cross choose.
//        qs.push('opts=' + opts);
         var selected_tab=[]
         Object.keys(app.parameters).forEach(i=>{
            if(app.selected_vers.indexOf(i) !==-1){
                if(selected_tab.indexOf(app.parameters[i]['type'])==-1){
                 selected_tab.push(app.parameters[i]['type'])
                }
            }
        })
        qs.push('opts=' + selected_tab.join(','));
    }
    if(vers) {
        qs.push('vers=' + vers);
    }
    if(diff) {
        qs.push('diff=true');
    }
    var url = '?' + qs.join('&');

//    console.log("f:set_url -->","opts:",opts,",v.opts",v.opts,",vers:",vers,",diff:",diff,",url_vers:",v,"qs:",qs,qs.length)
//    console.log("f:set_url -->","url:",url)
    window.history.pushState('', '', url);
};

/* url: index.html?opts=mysql&vers=10.11.5&diff=true */
function url_vers() {
    var searchUrl = window.location.search;
    var v = { opts: 'mysqld', vers: [], diff: false };
    var re_opts = /[?&]opts=([^?&]+)/;
    var re_vars = /[?&]vers=([^?&]+)/;
    var re_diff = /[?&]diff=true/;
//    console.log("searchUrl.match(re_opts):",searchUrl.match(re_opts))
//    console.log("searchUrl.match(re_vars):",searchUrl.match(re_vars))
//    console.log("searchUrl.match(re_diff):",searchUrl.match(re_diff))

    if(searchUrl.match(re_opts)) {
        v.opts = searchUrl.match(re_opts)[1].split(',');
    }
    if(searchUrl.match(re_vars)) {
        v.vers = searchUrl.match(re_vars)[1].split(',');
    }
    if(searchUrl.match(re_diff)) {
        v.diff = true;
    }
//    console.log("f:url_vers -->",v)
    return v;
};

window.onpopstate = function(event) {
    obj = url_vers();
    app.selected_opts = obj.opts;
    app.selected_vers = obj.vers;
    app.only_difference = obj.diff;
//    console.log("??? onpopstate:",obj)
};