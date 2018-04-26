var rnd = new RNG(100);
var sea_level = 0.3;
var mount_level = 0.04;
var w = 60, h = 60;
var compactness = 2;
var forest_threshold = 0.4;
var desert_threshold = 0.15;
var ocean_wetness = 0.7;
var region_shrink = 2;
var region_grow = 1;
var seed = 3;

var TERRAIN = {
    'sea':{'opacity':0.1, 'background':'blue'},
    'ice':{'opacity':0.6, 'background':'white'},
    'grassland':{'opacity':1, 'background':'#26A65B', 'has_region':true, "hospitable":true},
    'desert':{'opacity':1, 'background':'#EDC9AF', 'has_region':true, "hospitable": false},
    'forest':{'opacity':1, 'background':'darkgreen', 'has_region':true, "hospitable":true},
    'snow':{'opacity':1, 'background':'white', 'has_region':true, "hospitable": false},
    'mountain':{'opacity':1, 'background':'brown', 'has_region':true, "hospitable": false},
}

function create_map(blank){
    if(blank)$('.main').remove();

    rnd = new RNG(seed);

    var land = perlin(w,h);

    var temp = perlin(w,h);
    temp = overlay(land,linear(w, h,false,true),1);

    var rain = perlin(w,h);

    land = normalise(land)

    var m = dynamic_threshold(land, mount_level);
    
    var o = radial(w, h,false, true);
    land = overlay(land, o, compactness);

    land = dynamic_threshold(land, sea_level);
    
    var sea_wet = mult(invert(blur(land,4)), ocean_wetness)
    rain = normalise(rain)
    rain = add(sea_wet,rain)
    display(rain)

    
    var terrain = create_terrain(land, m, temp, rain);

    var hospitability_map = apply(terrain, (t) => (TERRAIN[t.terrain].hospitable) && (TERRAIN[t.terrain].has_region||false) ? 1 : 0)

    var cont = hospitability_map;
    for(var i = 0; i < region_shrink;i++)
        cont = shrink(cont)
    for(var i = 0; i < region_grow;i++)
        cont = grow(cont)
    cont = create_regions(cont);

    terrain = add(terrain, cont);
    terrain = expand_regions(terrain);
    display(terrain);

}
$(document).ready(function(){
    create_map();
    var settings = $('<div/>').appendTo('body');

    $('<button/>').text("Reseed").appendTo(settings).click(function(){
        seed = Math.random();
        create_map(true);
    });
    settings.append('<br>');
    $('<label/>').text("Sea Level:").appendTo(settings);
    $('<input type="range" min="0" max="1" step="0.01">').val(sea_level).appendTo(settings).bind('change', function(){
        sea_level = $(this).val();
        create_map(true);
    });
    settings.append('<br>');

    $('<label/>').text("Compactness:").appendTo(settings);
    $('<input type="range" min="0" max="5" step="0.1">').val(compactness).appendTo(settings).bind('change', function(){
        compactness = $(this).val();
        create_map(true);
    });
    settings.append('<br>');
    $('<label/>').text("Forest Threshold:").appendTo(settings);
    $('<input type="range" min="0" max="1" step="0.01">').val(forest_threshold).appendTo(settings).bind('change', function(){
        forest_threshold = $(this).val();
        create_map(true);
    });
     settings.append('<br>');
    $('<label/>').text("Mount Threshold:").appendTo(settings);
    $('<input type="range" min="0" max="0.1" step="0.005">').val(mount_level).appendTo(settings).bind('change', function(){
        mount_level = $(this).val();
        create_map(true);
    });


    settings.append('<br>');
    $('<label/>').text("Desert Threshold:").appendTo(settings);
    $('<input type="range" min="0" max="1" step="0.01">').val(desert_threshold).appendTo(settings).bind('change', function(){
        desert_threshold = $(this).val();
        create_map(true);
    });

    settings.append('<br>');
    $('<label/>').text("Ocean Wetness:").appendTo(settings);
    $('<input type="range" min="0" max="1" step="0.01">').val(ocean_wetness).appendTo(settings).bind('change', function(){
        ocean_wetness = $(this).val();
        create_map(true);
    });
    settings.append('<br>');
    $('<label/>').text("Region Shrink:").appendTo(settings);
    $('<input type="range" min="0" max="4" step="1">').val(region_shrink).appendTo(settings).bind('change', function(){
        region_shrink = $(this).val();
        create_map(true);
    });
   settings.append('<br>');
    $('<label/>').text("Region Grow:").appendTo(settings);
    $('<input type="range" min="0" max="4" step="1">').val(region_grow).appendTo(settings).bind('change', function(){
        region_grow = $(this).val();
        create_map(true);
    });
   settings.append('<br>');
});

function noise(w,h){
    var n = []
    for(x=0; x < w; x++){
        n[x] = []
        for(y=0; y < h; y++){
            n[x][y] = rnd.nextFloat();
        }
    }
    return n;
}

function perlin(w,h){
    var layers = [
        [ 30,  30, 0.05],
        [ 25,  25, 0.05],
        [ 12,  12, 0.3],
        [  6,   6, 0.6],
        [  3,   3, 0.1],
    ]

    var n = mult(noise(w, h), layers[0][2])
    for(var i = 1; i< layers.length; i++){
        var new_n = mult(normalise(noise(layers[i][0], layers[i][1])), layers[i][2]);
        n = add(n, scale(new_n, w, h));
    }
    return n;
}
function linear(w,h, inv, bi){
    var n = []
    var mx = w/2, my = h/2;
    for(x=0; x < w; x++){
        n[x] = []
        for(y=0; y < h; y++){
            var dy = y/h;
            if(bi)
                dy = Math.abs(y/h*2 -1);
            n[x][y] = dy;  
            if(!inv)
                n[x][y] = 1-n[x][y];
        }
    }
    return n;
}


function radial(w,h, inv, square){
    var n = []
    var mx = w/2, my = h/2;
    for(x=0; x < w; x++){
        n[x] = []
        for(y=0; y < h; y++){
            var dx = (x - mx)/mx;
            var dy = (y - my)/my;
            if(square)
                n[x][y] = Math.max(Math.abs(dx), Math.abs(dy));  
            else
                n[x][y] = dx*dx + dy*dy;  
            if(!inv)
                n[x][y] = 1-n[x][y];
        }
    }
    return n;
}

function spiral(n, x,y, callback){
    var ds = [[1,0], [0,1], [-1,0], [0,-1]];
    var i = 0;
    callback(n,x,y);
    while(true){
        i++;
        var dx = ds[i%4][0];
        var dy = ds[i%4][1];
        var leg = Math.ceil(i/2);
        for(var j = 0; j < leg; j++){
            x += dx;
            y += dy;
            var r = callback(n,x,y);
            if(r)
                return r;
            if(i > 1000){
                throw("Spiraled out of control")
            }
        }
    }
}

function scale(s, w, h){
    var sw = s.length
    var sh = s[0].length
    var n = []
    for(x=0; x < w; x++){
        n[x] = []

        var ind = (sw)/w*x;
        ind *= (sw-1)/sw;
        var sx1 = Math.floor(ind); 
        var sx2 = Math.ceil(ind); 
        var rx = sx2-ind;

        for(y=0; y < h; y++){
            var ind = (sh)/h*y;
            ind *= (sh-1)/sh;
            var sy1 = Math.floor(ind); 
            var sy2 = Math.ceil(ind); 
            var ry = sy2-ind;

            var v11 = s[sx1][sy1];
            var v12 = s[sx1][sy2] || 0;
            var vy1 =  v11*ry+v12*(1-ry);
           
            var vy2 = 0;
            var v21 = s[sx2][sy1];
            var v22 = s[sx2][sy2];
            vy2 =  v21*ry+v22*(1-ry);
            
            n[x][y] = rx*vy1 + (1-rx)*vy2;
        }
    }
    return n;
}

function display(n){
    var w = n.length
    var h = n[0].length
    var $main = $('<div class="main"/>').prependTo('body');
    for(y=0; y < h; y++){
        for(x=0; x < w; x++){
            if(n[x][y] === undefined){
                throw("Undefined tile");
            }

            if($.isNumeric(n[x][y])){
                var c = parseFloat(n[x][y]);
                $('<div/>').appendTo($main).css("opacity",c);
            }else if(n[x][y].r ||n[x][y].b || n[x][y].g){
                var c = 'rgb('+n[x][y]['r']+', '+n[x][y]['g']+', '+n[x][y]['b']+')';
                var t = $('<div/>').appendTo($main).css("opacity","1").css('background', c);

            }else if(n[x][y].terrain){
                var t = $('<div/>').appendTo($main).css("opacity","1");
                
                if(TERRAIN[n[x][y].terrain]){
                    t.css('background',TERRAIN[n[x][y].terrain].background);;
                    t.css('opacity',TERRAIN[n[x][y].terrain].opacity);;
                }
                
                if(n[x][y].region){
                    var reg = n[x][y].region
                    var c = 'rgb('+reg.r+', '+reg.g+', '+reg.b+')';

                    if(!n[x][y-1]|| n[x][y-1].region != n[x][y].region)
                        t.css('border-top',"2px solid "+c);
                    if(!n[x][y+1] || n[x][y+1].region != n[x][y].region)
                        t.css('border-bottom',"2px solid "+c);
                    if(!n[x+1] || n[x+1][y].region != n[x][y].region)
                        t.css('border-right',"2px solid "+c);
                    if(!n[x-1] || n[x-1][y].region != n[x][y].region)
                        t.css('border-left',"2px solid "+c);
                }
            }
        }
        $('.main').append("</br>")
    }
}

function create_terrain(land, mount, temp, rain){
    var w = land.length
    var h = land[0].length
    var n = []
    for(x=0; x < w; x++){
        n[x] = []
        for(y=0; y < h; y++){
            if(land[x][y]){
                if(mount[x][y])
                    n[x][y] = {terrain:"mountain"}
                else{
                if(temp[x][y] < 0.45)
                    n[x][y] = {terrain:"snow"}
                else
                    if(rain[x][y] > forest_threshold)
                        n[x][y] = {terrain:"forest"}
                    else if(rain[x][y] > desert_threshold || temp[x][y] < 0.5)
                        n[x][y] = {terrain:"grassland"}
                    else
                        n[x][y] = {terrain:"desert"}

                }
            }else{
                if(temp[x][y] < 0.1)
                    n[x][y] = {terrain:"ice"}
                else
                    n[x][y] = {terrain:"sea"}
            }
        }
    }
    return n;
}

function subtract(n1, n2){
    var w = n1.length
    var h = n1[0].length
    var n = []
    for(x=0; x < w; x++){
        n[x] = []
        for(y=0; y < h; y++){
            n[x][y] = Math.max(n1[x][y] - n2[x][y], 0);
        }
    }
    return n;
}
function overlay(n1, n2, strength){
    strength = strength || 2;
    var w = n1.length
    var h = n1[0].length
    var n = []
    for(x=0; x < w; x++){
        n[x] = []
        for(y=0; y < h; y++){
            if(n2[x][y] > 0.5){
                var r = n2[x][y]*2-1;
                r = Math.pow(r, strength)
                n[x][y] = n1[x][y]*(1-r) + r;
            }else{
                var r = -1 * (n2[x][y]*2-1);
                r = Math.pow(r, strength)
                n[x][y] = n1[x][y]*(1-r);
            }
        }
    }
    return n;
}

function add(n1, n2){
    var w = n1.length
    var h = n1[0].length
    var n = []
    for(x=0; x < w; x++){
        n[x] = []
        for(y=0; y < h; y++){
            if(n2[x][y] === 0){
                n[x][y] = n1[x][y];
            }else if($.isNumeric(n2[x][y])){
                n[x][y] = n1[x][y] + n2[x][y];
            }else if(n2[x][y].r || n2[x][y].g || n2[x][y].b){
                n[x][y] = n1[x][y];
                n[x][y].region = n2[x][y];
            }else{
                n[x][y] = n2[x][y];
            }
        }
    }
    return n;
}

function expand_regions(s){
    var w = s.length
    var h = s[0].length
    var n = []
    for(x=0; x < w; x++){
        n[x] = []
        for(y=0; y < h; y++){
            n[x][y] = {};
            n[x][y].terrain = s[x][y].terrain;
            if(TERRAIN[n[x][y].terrain].has_region)
                n[x][y].region = s[x][y].region;
            if(TERRAIN[n[x][y].terrain].has_region && !n[x][y].region)
                n[x][y].region = get_closest(s, x, y);

        }
    }
    console.log(n);
    return n;
}

function get_closest(n, x, y){
    return spiral(n, x,y,function(n,x,y){
        if(n[x] && n[x][y] && n[x][y].region){
            return n[x][y].region;
        }else{
            return false;
        }
    }) 
}

function mult(s, factor){
    var w = s.length
    var h = s[0].length
    var n = []
    for(x=0; x < w; x++){
        n[x] = []
        for(y=0; y < h; y++){
            n[x][y] = s[x][y] * factor;
        }
    }
    return n;
}
function expo(s, factor){
    var w = s.length
    var h = s[0].length
    var n = []
    for(x=0; x < w; x++){
        n[x] = []
        for(y=0; y < h; y++){
            n[x][y] = Math.pow(s[x][y], factor);
        }
    }
    return n;
} 

function grow(s){
    var w = s.length
    var h = s[0].length
    var n = []
    for(x=0; x < w; x++){
        n[x] = []
        for(y=0; y < h; y++){
            n[x][y] = s[x][y];
            if(n[x][y]==0){
                if(x!=0 && s[x-1][y])
                    n[x][y] = 1;
                if(x!=w-1 && s[x+1][y])
                    n[x][y] = 1;
                if(y!=h-1 && s[x][y+1])
                    n[x][y] = 1;
                if(y!=0 && s[x][y-1])
                    n[x][y] = 1;

                if(y!=0 && x!=0 && s[x-1][y-1])
                    n[x][y] = 1;
                if(y!=h-1 && x!=0 && s[x-1][y+1])
                    n[x][y] = 1;
                if(y!=0 && x!=w-1 && s[x+1][y-1])
                    n[x][y] = 1;
                if(y!=h-1 && x!=w-1 && s[x+1][y+1])
                    n[x][y] = 1;
            }
        }
    }
    return n;
}

function shrink(s){
    var w = s.length
    var h = s[0].length
    var n = []
    for(x=0; x < w; x++){
        n[x] = []
        for(y=0; y < h; y++){
            if(s[x][y] == 0 || x==0 || y == 0 || x == w-1 || y == h -1){
                n[x][y] = 0;
            }else{
                if(s[x+1][y] && s[x-1][y] && s[x][y+1] && s[x][y-1] &&
                   s[x+1][y+1] && s[x-1][y+1] && s[x-1][y+1] && s[x-1][y-1]){
                   n[x][y] = 1; 
                }else{ 
                   n[x][y] = 0; 
                }
            }
        }
    }
    return n;
}
function invert(s, th){
    var w = s.length
    var h = s[0].length
    var n = []
    for(x=0; x < w; x++){
        n[x] = []
        for(y=0; y < h; y++){
            n[x][y] = 1-s[x][y];
        }
    }
    return n;
}
function apply(s, f){
    var w = s.length
    var h = s[0].length
    var n = []
    for(x=0; x < w; x++){
        n[x] = []
        for(y=0; y < h; y++){
            n[x][y] = f(s[x][y]);
        }
    }
    return n;

}
function threshold(s, th){
    var w = s.length
    var h = s[0].length
    var n = []
    for(x=0; x < w; x++){
        n[x] = []
        for(y=0; y < h; y++){
            n[x][y] = s[x][y] > th ? 1 : 0;
        }
    }
    return n;
}
function normalise(s){
    var w = s.length
    var h = s[0].length
    var n = []
    var min = 1; 
    for(x=0; x < w; x++){
        for(y=0; y < h; y++){
            min = Math.min(min, s[x][y]);
        }
    }
    for(x=0; x < w; x++){
        n[x] = []
        for(y=0; y < h; y++){
            n[x][y] = s[x][y]-min;
        }
    }
    var max = 0; 
    for(x=0; x < w; x++){
        for(y=0; y < h; y++){
            max = Math.max(max, s[x][y]);
        }
    }
    for(x=0; x < w; x++){
        for(y=0; y < h; y++){
            n[x][y] = n[x][y]/max;
        }
    }
    var target = 0.5;
    var pivot = 3;
    var jump= pivot/2;
    var prev_c = null;
    var i = 0;
    while(true){
        i++;
        if(i>1000){
            throw ("😫");
        }
        var n = expo(s, pivot);
        var c = avg(n);
        if(c < target)
            pivot -= jump;
        else
            pivot += jump;
        jump/= 2;
        
        if(prev_c && Math.abs(c-prev_c) < 5)
            return n;
        prev_c = c;
    }
    return n;
}
function create_regions(s){
    var w = s.length
    var h = s[0].length
    var n = []
    var colors = [
        {'r':230, 'g':30, 'b':30},
        {'r':30, 'g':230, 'b':30},
        {'r':30, 'g':30, 'b':230},
        {'r':230, 'g':30, 'b':230},
        {'r':230, 'g':230, 'b':30},
        {'r':30, 'g':230, 'b':230},
        {'r':230, 'g':130, 'b':230},
        {'r':230, 'g':230, 'b':130},
        {'r':130, 'g':230, 'b':230},
    ]
    var cbackup = JSON.parse(JSON.stringify(colors));
    for(x=0; x < w; x++){
        n[x] = []
        for(y=0; y < h; y++){
            n[x][y] = JSON.parse(JSON.stringify(s[x][y]));
        }
    }
    for(x=0; x < w; x++){
        for(y=0; y < h; y++){
            if(colors.length == 0){
                colors = JSON.parse(JSON.stringify(cbackup));
            }
            if(n[x][y]){
                floodfill(n, x, y, n[x][y], colors.shift())
            }
        }
    }
    return n;
}

function floodfill(n, x, y, from, to){
    if(!n[x] || !n[x][y] || n[x][y]!== from) return;
    n[x][y]= to; 
    floodfill(n, x+1, y, from, to);
    floodfill(n, x, y+1, from, to);
    floodfill(n, x-1, y, from, to);
    floodfill(n, x, y-1, from, to);

    floodfill(n, x-1, y-1, from, to);
    floodfill(n, x-1, y+1, from, to);
    floodfill(n, x+1, y+1, from, to);
    floodfill(n, x+1, y-1, from, to);
}

function blur(s, d){
    d = d||1;
    var h = s[0].length
    var w = s.length
    var out = []
    for(x=0; x < w; x++){
        out[x] = []
        for(y=0; y < h; y++){
            out[x][y] = get(s, x, y) / 9 
            out[x][y] += get(s, x+1, y) / 9 
            out[x][y] += get(s, x-1, y) / 9 

            out[x][y] += get(s, x, y+1) / 9 
            out[x][y] += get(s, x+1, y+1) / 9 
            out[x][y] += get(s, x, y+1) / 9 

            out[x][y] += get(s, x+1, y-1) / 9 
            out[x][y] += get(s, x-1, y-1) / 9 
            out[x][y] += get(s, x-1, y-1) / 9 
        }
    }
    if(d==1){
        return out;
    }else{
        return blur(out, d-1)
    }
}

function get(s,x,y,def){
    if(s[x] && s[x][y]){
        return s[x][y]
    }
    return def || 0;
}

function count(s){
    var h = s[0].length
    var w = s.length
    var count = 0;
    for(x=0; x < w; x++){
        for(y=0; y < h; y++){
            count += s[x][y] ? 1 : 0;
        }
    }
    return count;
}

function avg(s){
    var h = s[0].length
    var w = s.length
    var count = 0;
    for(x=0; x < w; x++){
        for(y=0; y < h; y++){
            count += s[x][y];
        }
    }
    return count/w/h;
}

function dynamic_threshold(s, r){
    var target = s.length*s[0].length*r;
    var jump= 0.25;
    var pivot = 0.5;
    var prev_c = null;
    var i = 0;
    while(true){
        i++;
        if(i>1000){
            throw ("😫");
        }
        var n = threshold(s, pivot);
        var c = count(n);
        if(c < target)
            pivot -= jump;
        else
            pivot += jump;
        jump/= 2;
        
        if(prev_c && Math.abs(c-prev_c) < 5)
            return n;
        prev_c = c;
    }
}
