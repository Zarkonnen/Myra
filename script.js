function hwl(name, volume) {
    return new Howl({src: ["sounds/" + name + ".ogg", "sounds/" + name + ".mp3", "sounds/" + name + ".wav"], volume: volume || 1});
}

var palette = false;
var scrollX = 0;
var t = 0;
var tiles = [];
var selection = {x: 80, y: 144};
var scale = 1;
var edit = true;
var paletteScrollX = 0;
const hurtTime = 120 * 3 + 20;
const maxHP = 12;
var level = 1;
var intro = true;
var victory = false;

const nickWalk = {x:256, y:0, frames: 8, period: 80};
const nickAttack = {x: 384, y: 0, frames: 6, period: 120};
const nickJumpStart = {x: 464, y: 0};
const nickJumpUp = {x: 464 + 16, y: 0};
const nickJumpDown = {x: 464 + 32, y: 0};
const nickJumpLand = {x: 464 + 48, y: 0};
const nickStun = {x: 544, y: 0};
const nickBlock = {x: 528, y: 0};
const nickDeath = {x: 544, y: 0, frames: 6, period: 300};

var overlays = [
    {x: 224, y: 176},
    
    {x: 256, y: 128},
    {x: 272, y: 128},
    {x: 288, y: 128},
    {x: 304, y: 128},
    {x: 320, y: 128},
    
    {x: 256, y: 160},
    {x: 272, y: 160},
    {x: 288, y: 160},
    {x: 304, y: 160},
    {x: 320, y: 160},
    
    {x: 256, y: 192},
    {x: 272, y: 192},
    {x: 288, y: 192},
    {x: 304, y: 192},
    {x: 320, y: 192},
];

var enemyType = {
    pimp: {
        walkAnim: {x:256, y:32, frames: 8, period: 80},
        speed: 0.04,
        attackAnim: {x:384, y:32, frames: 4, period: 200},
        deathAnim: {x:448, y:32, frames: 4, period: 200},
        stunFrame: {x:448, y:32},
        hitStun: 1000,
        hurtStun: 400,
        attackInterval: 1000,
        hp: 2,
        attackDamage: 3
    },
    taxCollector: {
        walkAnim: {x:256, y:16, frames: 8, period: 80},
        speed: 0.045,
        attackAnim: {x:384, y:16, frames: 4, period: 200},
        deathAnim: {x:448, y:16, frames: 4, period: 200},
        stunFrame: {x:448, y:16},
        hitStun: 400,
        hurtStun: 800,
        attackInterval: 800,
        hp: 2,
        attackDamage: 3
    }
};

var pickupType = {
    wine: {
        x: 256,
        y: 64,
        hp: 4
    },
    bread: {
        x: 272,
        y: 64,
        hp: 3
    },
    church: {
        x: 288,
        y: 64,
        hp: 12
    }
};

var enemies = [];
var pickups = [];

var player = null;

function reset() {
    tiles = levels[level].tiles;
    player = {
        x: 34,
        y: levels[level].groundLevel,
        dy: 0,
        flip: false,
        animTime: 0,
        attackTime: 0,
        attacking: false,
        landTime: 0,
        stun: 0,
        hp: maxHP,
        blocking: false
    };
    
    enemies = levels[level].enemies.map(x => {
        return {
            type: enemyType[levels[level].enemyType],
            x: x,
            y: levels[level].groundLevel,
            animTime: 0,
            flip: true,
            stun: 0,
            hp: enemyType[levels[level].enemyType].hp,
            attacking: false,
            cooldown: 0
        }
    });
    pickups = levels[level].pickups.map(p => {
        return {
            x: p.x,
            y: p.y,
            type: pickupType[p.type]
        }
    });
    intro = true;
    victory = false;
}

//tiles = levels[1].tiles;//genTiles(64, 8);

reset();

var floorTs = [
    {x: 224, y: 192},
    {x: 96, y: 304},
    {x: 112, y: 304},
    {x: 128, y: 304},
    {x: 144, y: 304},
    {x: 160, y: 304},
    {x: 176, y: 304},
    {x: 192, y: 304},
    {x: 208, y: 304},
    {x: 256, y: 288},
    {x: 304, y: 288},
    {x: 304, y: 272},
    {x: 288, y: 272},
    {x: 272, y: 272},
    {x: 256, y: 272},
    {x: 240, y: 272},
]
function isFloor(x, y) {
    if (x < 0 || x >= tiles[0].length || y < 0) { return false; }
    if (y >= tiles.length) { return true; }
    return floorTs.some(ft => tiles[y][x].x == ft.x && tiles[y][x].y == ft.y);
}

function genTiles(w, h) {
    var ts = [];
    for (var y = 0; y < h; y++) {
        var row = [];
        ts.push(row);
        for (var x = 0; x < w; x++) {
            row.push(y == h - 1 ? {x:144, y:240} : y == h - 2 ? {x:128, y: 240} : {x: 80, y: 144});
        }
    }
    return ts;
}

function tick(ms) {
    t += ms;
    scale = 1;
    while (320 * (scale + 1) <= window.innerWidth && 224 * (scale + 1) <= window.innerHeight) {
        scale++;
    }
    jQuery(canvas).css("width", (320 * scale)).css("height", (224 * scale));
    
    if (edit) {
        c.fillStyle = "#00021c";
        c.fillRect(0, 0, 320, 224);
    }
    
    if (victory && !edit) {
        blit({x: 528, y: 224, w: 160, h: 224}, 0, 0);
        blit({x: 528, y: 224, w: 160, h: 224}, 160, 0, 0, true);
        blit(levels[level].victory, (320 - 96) / 2, 40);
        drawText(levels[level].victoryText, Math.floor((320 - textWidth(levels[level].victoryText)) / 2), 16, 2);
        drawText("E OR SPACE TO CONTINUE", Math.floor((320 - textWidth("E OR SPACE TO CONTINUE")) / 2), 224 - 32, 1);
        if (pressed(" ") || pressed("E")) {
            //level++;
            reset();
        }
        return;
    }
    
    if (intro && !edit) {
        c.fillStyle = "#a3ccd9";
        c.fillRect(0, 0, 320, 224);
        c.fillStyle = "#7497a6";
        c.fillRect(2, 2, 320 - 4, 224 - 4);
        drawText(levels[level].date, 16, 16, 2);
        drawText(levels[level].intro, 16, 32, 0);
        drawText("E OR SPACE TO START", 16, 224 - 32, 1);
        if (pressed(" ") || pressed("E")) {
            intro = false;
        }
        return;
    }
    
    for (var y = 0; y < tiles.length; y++) { for (var x = 0; x < tiles[0].length; x++) {
        blit(tiles[y][x], x * 16 - scrollX, y * 16);
    }}
    
    // Pickups
    pickups.forEach(p => {
        blit(p.type, p.x - scrollX, p.y);
    });
    
    if (edit) {
        blit(selection, 0, 0);
        
        if (pressed(" ")) {
            palette = !palette;
        }
        if (down("ArrowLeft")) {
            if (palette) {
                paletteScrollX++;
            } else {
                scrollX--;
            }
        }
        if (down("ArrowRight")) {
            if (palette) {
                paletteScrollX--;
            } else {
                scrollX++;
            }
        }
        if (pressed("V")) {
            console.log(JSON.stringify(tiles));
        }
        
        // Balconies etc
        for (var y = 0; y < tiles.length; y++) { for (var x = 0; x < tiles[0].length; x++) {
            overlays.forEach(o => {
                if (tiles[y][x].x == o.x && tiles[y][x].y == o.y + 16) {
                    blit(o, x * 16 - scrollX, y * 16 - 16);
                }
            });
        }}
        
        var tx = Math.floor((cursor.x + scrollX) / 16);
        var ty = Math.floor(cursor.y / 16);
        drawText(tx + ", " + ty, 320 - 48, 0);
        
        if (palette) {
            blit({x: -paletteScrollX * 16, y: 128, w: 320, h: 224}, 0, 0);
            if (click) {
                selection = {x: Math.floor(click.x / 16 - paletteScrollX) * 16, y: Math.floor(click.y / 16) * 16 + 128};
            }
            c.fillStyle = "yellow";
            c.fillRect(selection.x + paletteScrollX * 16, selection.y - 128, 16, 1);
            c.fillRect(selection.x + paletteScrollX * 16, selection.y - 128, 1, 16);
            c.fillRect(selection.x + paletteScrollX * 16 + 15, selection.y - 128, 1, 16);
            c.fillRect(selection.x + paletteScrollX * 16, selection.y - 128 + 15, 16, 1);
        } else if (mouseDown) {
            if (tx >= 0 && tx < tiles[0].length && ty < tiles.length) {
                tiles[ty][tx] = selection;
            }
        }
        return;
    }
    
    // Enemies
    enemies.forEach(e => {
        var anim = e.type.walkAnim;
        if (e.stun > 0) {
            anim = e.type.stunFrame;
        }
        if (e.hp <= 0) {
            anim = e.type.deathAnim;
        }
        if (e.attacking) {
            anim = e.type.attackAnim;
        }
        blit(anim, Math.floor(e.x - scrollX), Math.floor(e.y), e.animTime, e.flip);
    });
    
    var prevFootTileY = Math.ceil(player.y / 16);
    var prevOnGround = player.y == levels[level].groundLevel;
    var prevOnPlatform = isFloor(Math.floor(player.x / 16 + 0.25), prevFootTileY + 1) || isFloor(Math.floor(player.x / 16 + 0.75), prevFootTileY + 1);
    var canJump = (prevOnGround || prevOnPlatform) && player.dy >= 0;
    player.y += player.dy * ms;
    var footTileY = Math.ceil(player.y / 16);
    if (player.y >= levels[level].groundLevel) {
        player.dy = 0;
        player.y = levels[level].groundLevel;
        if (!prevOnGround) {
            player.landTime = 200;
        }
    } else if (footTileY > prevFootTileY && (isFloor(Math.floor(player.x / 16 + 0.25), footTileY) || isFloor(Math.floor(player.x / 16 + 0.75), footTileY))) {
        player.dy = 0;
        player.y = prevFootTileY * 16;
        if (!prevOnPlatform) { // Actually broken, eh.
            player.landTime = 200;
        }
    } else {
        player.dy += 0.0002 * ms;
    }
    
    if (player.landTime <= 0 && player.stun <= 0 && player.hp > 0) {
        if (!player.attacking && (pressed(" ") || pressed("E"))) {
            player.attacking = true;
            player.attackTime = 0;
            player.animTime = 0;
        }
        player.blocking = false;
        if (down("ArrowDown") || down("S")) {
            player.blocking = true;
        } else {
            if (canJump && (down("ArrowUp") || down("W"))) {
                player.dy = -0.12;
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
        }
    } else {
        player.landTime -= ms;
    }
    
    if (player.x >= tiles[0].length * 16 - 6 * 16) {
        victory = true;
    }
    
    player.x = Math.max(0, Math.min(tiles[0].length * 16 - 16, player.x));
    var prevScrollX = scrollX;
    scrollX = Math.min(tiles[0].length * 16 - 320, Math.max(0, Math.floor(player.x + 8 - 160)));
    
    for (var i = 0; i < pickups.length; i++) {
        var p = pickups[i];
        if (player.hp < maxHP && p.x + 4 <= player.x + 12 && p.x + 12 >= player.x + 4 && p.y <= player.y + 16 && p.y + 16 >= player.y) {
            player.hp = Math.min(maxHP, player.hp + p.type.hp);
            pickups.splice(i, 1);
            i--;
        }
    }
    
    if (player.hp <= 0) {
        player.animTime += ms;
    } else if (player.stun > 0) {
        player.stun -= ms;
    } else if (player.attacking) {
        var prevHurt = player.attackTime < hurtTime;
        player.attackTime += ms;
        if (prevHurt && player.attackTime >= hurtTime) {
            // Find an enemy to hurt.
            var hurtBoxX = player.flipped ? player.x - 8 : player.x + 8;
            var hurtBoxY = player.y;
            var hurtBoxW = 16;
            var hurtBoxH = 16;
            var candidates = enemies.filter(e => e.stun <= 0 && e.x + 16 >= hurtBoxX && e.x <= hurtBoxX + hurtBoxW && e.y + 16 >= hurtBoxY && e.y <= hurtBoxY + hurtBoxH);
            if (candidates.length == 0) {
                candidates = enemies.filter(e => e.x + 16 >= hurtBoxX && e.x <= hurtBoxX + hurtBoxW && e.y + 16 >= hurtBoxY && e.y <= hurtBoxY + hurtBoxH);
            }
            if (candidates.length != 0) {
                var e = candidates[0];
                e.hp--;
                e.stun = e.type.hitStun;
                e.animTime = 0;
                e.attacking = false;
            }
        }
        player.animTime += ms;
        if (player.animTime >= nickAttack.period * nickAttack.frames) {
            player.attacking = false;
            player.animTime = 0;
        }
    }
    
    if (player.hp <= 0) {
        blit(nickDeath, Math.floor(player.x) - scrollX, Math.floor(player.y), Math.min(player.animTime, nickDeath.frames * nickDeath.period - 1), player.flip);
    } else if (player.stun > 0) {
        blit(nickStun, Math.floor(player.x) - scrollX, Math.floor(player.y), player.animTime, player.flip);
    } else if (player.blocking) {
        blit(nickBlock, Math.floor(player.x) - scrollX, Math.floor(player.y), player.animTime, player.flip);
    } else if (player.attacking) {
        blit(nickAttack, Math.floor(player.x) - scrollX, Math.floor(player.y), player.animTime, player.flip);
    } else if (player.landTime > 0) {
        blit(nickJumpLand, Math.floor(player.x) - scrollX, Math.floor(player.y), player.animTime, player.flip);
    } else if (!prevOnGround && !prevOnPlatform) {
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
    
    // Balconies etc
    for (var y = 0; y < tiles.length; y++) { for (var x = 0; x < tiles[0].length; x++) {
        overlays.forEach(o => {
            if (tiles[y][x].x == o.x && tiles[y][x].y == o.y + 16) {
                blit(o, x * 16 - prevScrollX, y * 16 - 16);
            }
        });
    }}
    
    enemies.forEach(e => {
        if (player.hp <= 0) { return; }
        if (e.hp <= 0) {
            e.animTime += ms;
            return;
        }
        if (e.stun > 0) { e.stun -= ms; return; }
        
        if (e.attacking) {
            e.animTime += ms;
            if (e.animTime >= e.type.attackAnim.frames * e.type.attackAnim.period) {
                e.attacking = false;
                e.animTime = 0;
                var hurtBoxX = e.flipped ? e.x - 16 : e.x;
                var hurtBoxY = e.y;
                var hurtBoxW = 32;
                var hurtBoxH = 16;
                if (!player.blocking && player.x + 16 >= hurtBoxX && player.x <= hurtBoxX + hurtBoxW && player.y + 16 >= hurtBoxY && player.y <= hurtBoxY + hurtBoxH) {
                    player.animTime = 0;
                    player.attacking = false;
                    player.stun = e.type.hurtStun;
                    player.hp -= e.type.attackDamage;
                }
            }
            return;
        }
        e.cooldown -= ms;
        if (Math.abs(e.x - player.x) <= 12 && player.y >= levels[level].groundLevel - 15 && e.cooldown <= 0) {
            e.flip = e.x > player.x;
            e.animTime = 0;
            e.attacking = true;
            e.cooldown = e.type.attackInterval;
            return;
        }
        if (player.y == levels[level].groundLevel && Math.abs(e.x - player.x) < 120 && Math.abs(e.x - player.x) > 10) {
            e.flip = e.x > player.x;
            e.x += (e.flip ? -1 : 1) * ms * e.type.speed;
            e.animTime += ms;
        }
    });
    
    enemies = enemies.filter(e => e.hp > 0 || e.animTime < e.type.deathAnim.frames * e.type.deathAnim.period);
    
    blit({x: 368, y: 224, w: 160, h: 96}, 0, 128);
    blit({x: 368, y: 224, w: 160, h: 96}, 160, 128, 0, true);
    c.fillStyle = "#d9214f";
    c.fillRect(48, 192, Math.floor(224.0 * Math.max(0, player.hp) / maxHP), 12);
    //drawText("HP", 19, 144);
    
    if (player.x < 120) {
        drawText("UP JUMP\nLEFT/RIGHT MOVE\n", 34, 144 + 8, 1);
        drawText("DOWN BLOCK", 320 - 34 - textWidth("DOWN BLOCK"), 144 + 8, 1);
        drawText("SPACE PUNCH", 320 - 34 - textWidth("SPACE PUNCH"), 144 + 8 + 16, 1);
    }
    //\nS/DOWN - BLOCK\nE/SPACE - PUNCH
    
    if (player.hp <= 0) {
        c.fillStyle = "#00021c";
        if (player.animTime > 4500) {
            reset();
        }
        if (player.animTime > 3600) {
            c.fillRect(0, 0, 320, 224);
        } else if (player.animTime > 2700) {
            for (var y = 0; y < 224; y += 2) {
                c.fillRect(0, y, 320, 1);
            }
        }
    }
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

var offsets = {
    A: 0,
    B: 9,
    C: 17,
    D: 24,
    E: 32,
    F: 40,
    G: 48,
    H: 55,
    I: 64,
    J: 69,
    K: 76,
    L: 85,
    M: 93,
    N: 103,
    O: 113,
    P: 121,
    Q: 129,
    R: 137,
    S: 146,
    T: 153,
    U: 162,
    V: 170,
    W: 177,
    X: 188,
    Y: 195,
    Z: 204,
    "?": 477,
    "!": 482,
    ".": 463,
    ",": 466,
    ";": 470,
    ":": 474,
    "'": 521,
    "0": 393,
    "1": 400,
    "2": 407,
    "3": 414,
    "4": 421,
    "5": 428,
    "6": 435,
    "7": 442,
    "8": 449,
    "9": 456,
    "(": 532,
    ")": 537,
    "-": 485,
    '/': 575
};

var widths = {
    A: 9,
    B: 8,
    C: 7,
    D: 8,
    E: 8,
    F: 8,
    G: 7,
    H: 9,
    I: 5,
    J: 7,
    K: 9,
    L: 8,
    M: 10,
    N: 10,
    O: 8,
    P: 8,
    Q: 8,
    R: 8,
    S: 7,
    T: 9,
    U: 8,
    V: 7,
    W: 11,
    X: 7,
    Y: 9,
    Z: 7,
    "?": 5,
    "!": 3,
    ".": 3,
    ",": 4,
    ";": 4,
    ":": 4,
    "'": 4,
    "0": 7,
    "1": 7,
    "2": 7,
    "3": 7,
    "4": 7,
    "5": 7,
    "6": 7,
    "7": 7,
    "8": 7,
    "9": 7,
    "(": 5,
    ")": 5,
    "-": 7,
    '/': 5
}

function textWidth(s) {
    var w = 0;
    for (var i = 0; i < s.length; i++) {
        w += widths[s[i]] || 7;
    }
    return w;
}

function drawText(s, x, y, color) {
    if (!images["font-black"]) {
        images["font-black"] = new Image();
        images["font-black"].src = "graphics/font-black.png" + "?" + (new Date()).getTime();
        images["font-white"] = new Image();
        images["font-white"].src = "graphics/font-white.png" + "?" + (new Date()).getTime();
        images["font-grey"] = new Image();
        images["font-grey"].src = "graphics/font-grey.png" + "?" + (new Date()).getTime();
        images["font-yellow"] = new Image();
        images["font-yellow"].src = "graphics/font-yellow.png" + "?" + (new Date()).getTime();
    }
    color = ["white", "grey", "yellow"][color || 0];
    var x2 = x;
    var y2 = y;
    for (var i = 0; i < s.length; i++) {
        if (s[i] == "\n") {
            y2 += 16;
            x2 = x;
            continue;
        }
        if (!widths[s[i]]) {
            x2 += 7;
            continue;
        }
        for (var dy = 0; dy <= 2; dy++) { for (var dx = 0; dx <= 2; dx++) {
            c.drawImage(images["font-black"], offsets[s[i]], 0, widths[s[i]], 16, x2 + dx, y2 + dy, widths[s[i]], 16);
        }}
        x2 += widths[s[i]];
    }
    x2 = x;
    y2 = y;
    for (var i = 0; i < s.length; i++) {
        if (s[i] == "\n") {
            y2 += 16;
            x2 = x;
            continue;
        }
        if (!widths[s[i]]) {
            x2 += 7;
            continue;
        }
        c.drawImage(images["font-" + color], offsets[s[i]], 0, widths[s[i]], 16, x2 + 1, y2 + 1, widths[s[i]], 16);
        x2 += widths[s[i]];
    }
    return y2 + 16;
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
