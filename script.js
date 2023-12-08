function hwl(name, volume) {
    return new Howl({src: ["sounds/" + name + ".ogg", "sounds/" + name + ".mp3", "sounds/" + name + ".wav"], volume: volume || 1});
}

var palette = false;
var scrollX = 0;
var t = 0;
var tiles = [];
var selection = {x: 80, y: 144};
const skyT = {x: 80, y: 144};
const roadT = {x: 64, y: 176};
var scale = 1;
var edit = false;

const nickWalk = {x:256, y:0, frames: 8, period: 80 };
const nickAttack = {x: 384, y: 0, frames: 6, period: 80};
const nickJumpStart = {x: 464, y: 0};
const nickJumpUp = {x: 464 + 16, y: 0};
const nickJumpDown = {x: 464 + 32, y: 0};
const nickJumpLand = {x: 464 + 48, y: 0};

var player = {
    x: 34,
    y: 104,
    dy: 0,
    flip: false,
    animTime: 0,
    attackTime: 0,
    attacking: false,
    landTime: 0
};

function isFloor(x, y) {
    if (x < 0 || x >= tiles[0].length || y < 0) { return false; }
    if (y >= tiles.length) { return true; }
    return tiles[y][x].x == 224 && tiles[y][x].y == 192;
}

function genTiles(w, h) {
    var ts = [];
    for (var y = 0; y < h; y++) {
        var row = [];
        ts.push(row);
        for (var x = 0; x < w; x++) {
            row.push(y == h - 1 ? roadT : skyT);
        }
    }
    return ts;
}

tiles = level1;//genTiles(64, 8);

function tick(ms) {
    t += ms;
    scale = 1;
    while (320 * (scale + 1) <= window.innerWidth && 224 * (scale + 1) <= window.innerHeight) {
        scale++;
    }
    jQuery(canvas).css("width", (320 * scale)).css("height", (224 * scale));
    
    c.fillStyle = "black";
    c.fillRect(0, 0, 320, 224);
    
    for (var y = 0; y < tiles.length; y++) { for (var x = 0; x < tiles[0].length; x++) {
        blit(tiles[y][x], x * 16 - scrollX, y * 16);
    }}
    
    if (edit) {
        blit(selection, 0, 0);
        
        if (pressed(" ")) {
            palette = !palette;
        }
        if (down("ArrowLeft")) {
            scrollX--;
        }
        if (down("ArrowRight")) {
            scrollX++;
        }
        if (pressed("1")) {
            scaleOverride = !scaleOverride;
        }
        if (pressed("V")) {
            console.log(JSON.stringify(tiles));
        }
        
        if (palette) {
            blit({x: 0, y: 128, w: 256, h: 192}, 0, 0);
            if (click) {
                selection = {x: Math.floor(click.x / 16) * 16, y: Math.floor(click.y / 16) * 16 + 128};
            }
            c.fillStyle = "yellow";
            c.fillRect(selection.x, selection.y - 128, 16, 1);
            c.fillRect(selection.x, selection.y - 128, 1, 16);
            c.fillRect(selection.x + 15, selection.y - 128, 1, 16);
            c.fillRect(selection.x, selection.y - 128 + 15, 16, 1);
        } else if (mouseDown) {
            var tx = Math.floor((cursor.x + scrollX) / 16);
            var ty = Math.floor(cursor.y / 16);
            if (tx >= 0 && tx < tiles[0].length && ty < tiles.length) {
                tiles[ty][tx] = selection;
            }
        }
        return;
    }
    
    var prevFootTileY = Math.ceil(player.y / 16);
    var prevOnFloor = player.y == 104 || isFloor(Math.floor(player.x / 16 + 0.25), prevFootTileY + 1) || isFloor(Math.floor(player.x / 16 + 0.75), prevFootTileY + 1);
    var canJump = prevOnFloor && player.dy >= 0;
    player.y += player.dy * ms;
    var footTileY = Math.ceil(player.y / 16);
    if (player.y >= 104) {
        player.dy = 0;
        player.y = 104;
        if (!prevOnFloor) {
            player.landTime = 120;
        }
    } else if (footTileY > prevFootTileY && (isFloor(Math.floor(player.x / 16 + 0.25), footTileY) || isFloor(Math.floor(player.x / 16 + 0.75), footTileY))) {
        player.dy = 0;
        player.y = prevFootTileY * 16;
        if (!prevOnFloor) {
            player.landTime = 120;
        }
    } else {
        player.dy += 0.0002 * ms;
    }
    
    if (player.landTime <= 0) {
        if (!player.attacking && (pressed(" ") || pressed("E"))) {
            player.attacking = true;
            player.attackTime = 0;
            player.animTime = 0;
        }
        if (canJump && (down("ArrowUp") || down("W"))) {
            player.dy = -0.1;
        }
        if (down("ArrowLeft") || down("A")) {
            player.flip = true;
            if (!player.attacking) {
                player.x -= ms / 30;
                player.animTime += ms;
            }
        } else if (down("ArrowRight") || down("D")) {
            player.flip = false;
            if (!player.attacking) {
                player.x += ms / 30;
                player.animTime += ms;
            }
        }
    } else {
        player.landTime -= ms;
    }
    
    player.x = Math.max(0, Math.min(tiles[0].length * 16 - 16, player.x));
    var prevScrollX = scrollX;
    scrollX = Math.min(tiles[0].length * 16 - 320, Math.max(0, Math.floor(player.x + 8 - 160)));
    
    if (player.attacking) {
        player.attackTime += ms;
        player.animTime += ms;
        if (player.animTime >= nickAttack.period * nickAttack.frames) {
            player.attacking = false;
            player.animTime = 0;
        }
    }
    
    if (player.attacking) {
        blit(nickAttack, Math.floor(player.x) - scrollX, Math.floor(player.y), player.animTime, player.flip);
    } else if (player.landTime > 0) {
        blit(nickJumpLand, Math.floor(player.x) - scrollX, Math.floor(player.y), player.animTime, player.flip);
    } else if (!prevOnFloor) {
        if (player.dy < -0.05) {
            blit(nickJumpStart, Math.floor(player.x) - scrollX, Math.floor(player.y), player.animTime, player.flip);
        } else if (player.dy <= 0) {
            blit(nickJumpUp, Math.floor(player.x) - scrollX, Math.floor(player.y), player.animTime, player.flip);
        } else {
            blit(nickJumpDown, Math.floor(player.x) - scrollX, Math.floor(player.y), player.animTime, player.flip);
        }
    } else {
        blit(nickWalk, Math.floor(player.x) - scrollX, Math.floor(player.y), player.animTime, player.flip);
    }
    
    for (var y = 0; y < tiles.length; y++) { for (var x = 0; x < tiles[0].length; x++) {
        if (tiles[y][x].x == 224 && tiles[y][x].y == 192) {
            blit({x: 224, y: 176}, x * 16 - prevScrollX, y * 16 - 16);
        }
    }}
    
    
    /*var layers = [80, 80, 80, 112, 32, 16, 64];
    var between = [{x:80, y:144}, {x:80, y:144}, {x:80, y:144}, {x:96, y:176}, {x:96, y:192}, {x:96, y:208}, {x:64, y:176}];
    for (var y = 0; y < layers.length; y++) { for (var x = 0; x < 320; x += 16) {
        if (x % 80 == 0) {
            blit(between[y], x, y * 16);
        } else {
            blit({x: layers[y], y: 144}, x, y * 16);
        }
    }}
    blit({x: 448, y: 16, frames: 4, period: 200}, 152, 90);
    /*if (t % 1000 < 500) {
        blit({x: 256 + 32, y: 48}, 10, 10);
    } else {
        blit({x: 448, y: 48}, 10, 10);
    }*/
}

var images = {};

function img(img, x, y) {
    if (img == null) { return; }
    if (!images[img]) {
        images[img] = new Image();
        images[img].src = "graphics/" + img + ".png";
    }
    c.drawImage(images[img], x, y);
}

function blit(img, x, y, time, flipped) {
    c.translate(x, y);
    if (flipped) {
        c.translate(img.w || 16, 0);
        c.scale(-1, 1);
    }
    if (!images["spritesheet"]) {
        images["spritesheet"] = new Image();
        images["spritesheet"].src = "graphics/spritesheet.png" + "?" + (new Date()).getTime();
    }
    if (img.frames) {
        var frame = Math.floor(time / (img.period || 200)) % img.frames;
        c.drawImage(images["spritesheet"], img.x + (img.w || 16) * frame, img.y, img.w || 16, img.h || 16, 0, 0, img.w || 16, img.h || 16);
    } else {
        c.drawImage(images["spritesheet"], img.x, img.y, img.w || 16, img.h || 16, 0, 0, img.w || 16, img.h || 16);
    }
    c.resetTransform();
}

var canvas = document.getElementById("gameCanvas");
var c = canvas.getContext("2d");
var keys = {};
var keyCodes = {};
var keysDown = {};
var keyCodesDown = {};
var click = null;
var mouseDown = false;
var cursor = {x: 300, y: 300};

// Listen for key presses.
function canvasKeyUp(e) {
    keyCodes[e.which] = true;
    keys[String.fromCharCode(e.which)] = true;
    keyCodesDown[e.key] = false;
    keysDown[String.fromCharCode(e.which)] = false;
}

function canvasKeyDown(e) {
    keyCodesDown[e.key] = true;
    keysDown[String.fromCharCode(e.which)] = true;
}

function pressed(key) {
    return !!keys[key] || !!keyCodes[key];
}

function down(key) {
    return !!keysDown[key] || !!keyCodesDown[key];
}

$('body').keyup(canvasKeyUp).keydown(canvasKeyDown);

// Listen for mouse stuff.
function canvasClick(e) {
    click = { "x": e.offsetX / scale, "y": e.offsetY / scale };
}

function canvasMouseDown(e) {
    mouseDown = true;
}

function canvasMouseUp(e) {
    mouseDown = false;
}

function canvasMove(e) {
    cursor = { "x": e.offsetX / scale, "y": e.offsetY / scale };
}

$('#gameCanvas').click(canvasClick).mousemove(canvasMove).mousedown(canvasMouseDown).mouseup(canvasMouseUp);

// Set up game loop.
var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
var lastUpdate = new Date().getTime();

function nextFrame() {
    var currentTime = new Date().getTime();
    tick(currentTime - lastUpdate);
    keys = {};
    keyCodes = {};
    click = null;
    lastUpdate = currentTime;
    requestAnimationFrame(nextFrame);
}

// Once everything is set up, start game loop.
requestAnimationFrame(nextFrame);
 
/*canvas.addEventListener("click", function() {
    if (canvas.webkitRequestFullScreen) {
        canvas.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    } else if (canvas.mozRequestFullScreen) {
        canvas.mozRequestFullScreen();
    } else if (canvas.requestFullScreen) {
        canvas.requestFullScreen();
    }
});*/
