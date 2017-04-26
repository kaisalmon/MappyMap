var rnd = new RNG(100);
var sea_level = 0.3;
var w = 30, h = 30;
var compactness = 0.3;
var seed = Math.random();

function create_map(){
    rnd = new RNG(seed);
    var layers = [
        [ 30,  30, 0.1],
        [ 25,  25, 0.2],
        [ 12,  12, 0.2],
        [  6,   6, 0.2],
        [  3,   3, 0.3],
    ]

    var n = mult(noise(w, h), layers[0][2])
    for(var i = 1; i< layers.length; i++){
        var new_n = mult(noise(layers[i][0], layers[i][1]), layers[i][2]);
        n = add(n, scale(new_n, w, h));
    }

    var o = radial(w, h);
    var os = compactness
    n = add(
        mult(n, 1-os),
        mult(o, os)
    );
    n = dynamic_threshold(n, sea_level);

    /*
    cont = shrink(n);
    cont = create_regions(cont);
    n = add(n, cont);
    n = expand_regions(n);
    */
    display(n);
}
$(document).ready(function(){
    create_map();
    var settings = $('<div/>').appendTo('body');

    $('<button/>').text("Reseed").appendTo(settings).click(function(){
        seed = Math.random();
        create_map();
    });
    settings.append('<br>');
    $('<label/>').text("Sea Level:").appendTo(settings);
    $('<input type="range" min="0" max="1" step="0.05">').val(sea_level).appendTo(settings).bind('change', function(){
        sea_level = $(this).val();
        create_map();
    });
    settings.append('<br>');

    $('<label/>').text("Compactness:").appendTo(settings);
    $('<input type="range" min="0" max="1" step="0.05">').val(compactness).appendTo(settings).bind('change', function(){
        compactness = $(this).val();
        create_map();
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

function radial(w,h, inv){
    var n = []
    var mx = w/2, my = h/2;
    for(x=0; x < w; x++){
        n[x] = []
        for(y=0; y < h; y++){
            var dx = (x - mx)/mx;
            var dy = (y - my)/my;
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
        var sx = parseInt(sw/w*x); 
        for(y=0; y < h; y++){
            var sy = parseInt(sh/h*y); 
            n[x][y] = s[sx][sy] 
        }
    }
    return n;
}

function display(n){
    var w = n.length
    var h = n[0].length
     $('.main').empty()
    for(y=0; y < h; y++){
        for(x=0; x < w; x++){
            if($.isNumeric(n[x][y])){
                var c = parseFloat(n[x][y]);
                $('<div/>').appendTo($('.main')).css("opacity",c);
            }else{
                var t = $('<div/>').appendTo($('.main')).css("opacity","1");
                t.css('background',"#444");
                var c = 'rgb('+n[x][y]['r']+', '+n[x][y]['g']+', '+n[x][y]['b']+')';

                if(!n[x][y-1] || !n[x][y-1].r || n[x][y-1] != n[x][y])
                    t.css('border-top',"2px solid "+c);
                if(!n[x][y+1] || !n[x][y+1].r || n[x][y+1] != n[x][y])
                    t.css('border-bottom',"2px solid "+c);
                if(!n[x+1] || !n[x+1][y].r || n[x+1][y] != n[x][y])
                    t.css('border-right',"2px solid "+c);
                if(!n[x-1] || !n[x-1][y].r || n[x-1][y] != n[x][y])
                    t.css('border-left',"2px solid "+c);
            }
        }
        $('.main').append("</br>")
    }
}

function add(n1, n2){
    var w = n1.length
    var h = n1[0].length
    var n = []
    for(x=0; x < w; x++){
        n[x] = []
        for(y=0; y < h; y++){
            if($.isNumeric(n2[x][y])){
                n[x][y] = n1[x][y] + n2[x][y];
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
            n[x][y] = s[x][y] == 1 ? get_closest(s,x,y) : s[x][y];
        }
    }
    console.log(n);
    return n;
}

function get_closest(n, x, y){
    return spiral(n, x,y,function(n,x,y){
        if(n[x] && n[x][y] && n[x][y].r){
            return n[x][y];
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
            n[x][y] = s[x][y];
        }
    }
    for(x=0; x < w; x++){
        for(y=0; y < h; y++){
            if(colors.length == 0){
                colors = JSON.parse(JSON.stringify(cbackup));
            }
            if(n[x][y] == 1){
                floodfill(n, x, y, n[x][y], colors.shift())
            }
        }
    }
    return n;
}

function floodfill(n, x, y, from, to){
    if(!n[x] || !n[x][y] || n[x][y] !== from) return;
    n[x][y] = to; 
    floodfill(n, x+1, y, from, to);
    floodfill(n, x, y+1, from, to);
    floodfill(n, x-1, y, from, to);
    floodfill(n, x, y-1, from, to);

    floodfill(n, x-1, y-1, from, to);
    floodfill(n, x-1, y+1, from, to);
    floodfill(n, x+1, y+1, from, to);
    floodfill(n, x+1, y-1, from, to);
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
