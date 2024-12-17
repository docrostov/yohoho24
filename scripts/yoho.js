const {
    canAdventure,
    toLocation,
    print,
    toInt,
    haveEffect,
    cliExecute,
    toEffect,
    toItem,
    mallPrice,
    abort,
    numericModifier,
    toElement,
    toSlot,
    equippedItem,
    equip,
    getProperty,
    itemAmount,
    useFamiliar,
    toFamiliar,
    myFullness,
    myInebriety,
    inebrietyLimit,
    fullnessLimit,
    eat,
    drink,
    use,
    useSkill,
    toSkill,
    myAdventures,
    equippedAmount,
} = require('kolmafia');

// Initialize constant lists necessary for the script.

// This is my estimated spirit value. It's the way it is because of me.
const VALUEOFSPIRIT = 3500;

// Item-generated buffs & price over which the item should not be bought
//   My math for this is pretty back-of-the-envelope. Assuming a value of
//   spirits at 3-4k (which seems fair), 1 point of NC means +1 NC per 100
//   turns, so +7 or so over a 700 turn day. So, value of 1% NC is:
//      val(NC) = # NCs * extra spirit * spirit val = 7 * (11-2) * 3500 = 220k
//   And if 1% is worth 220k over the whole day, these are the prices at
//   which the various NC buffs stop being worth it to snag.

// Stench res is more complicated, but a similar equation sort of works. 
//   There are deeper diminishing returns on stench res, but for gross
//   approximation, 5 stench res is worth #NCs * spirit. That means...
//      val(RES) = # NCs * spirit val / 5 = 245 * 3500 / 5 = 170k
//   Which lead to the following price distribution.

const NCBUFFS = {
    'Become Superficially Interested': 31000, // 5 nc; 100 turns
    'Gummed Shoes':15000,           // 5 nc; 50 turns
    'Cocoa-Buttery': 6000,          // 5 nc; 20 turns
    'Feeling Sneaky': 6000,         // 5 nc; 20 turns
    'Fresh Scent': 3300,            // 5 nc; 11 turns
    'Ultra-Soft Steps':1500,        // 5 nc; 5 turns
    'Resined': 2000,                // leaves, included bc leaf balm exists
};

const RESBUFFS = {
    'Covered in the Rainbow': 36000,// 2 all res, 80 turns
    'Minor Invulnerability': 21000, // 3 all-res, 30 turns
    'Autumnically Balmy':13500,     // 2 all-res, 30 turns
    'Oiled-Up': 9000,               // 2 all res, 20 turns
    'Red Door Syndrome': 4500,      // 2 all res, 10 turns
    // 'Incredibly Healthy':6000,      // 3 all-res, 5 turns
}

const STENCHBUFFS = {
    'On Smellier Tides': 4500,      // 1 stench res, 20 turns
    'Smelly Pants': 2000,           // 1 stench res, 10 turns               
};

const SLEAZEBUFFS = {
    'Boisterous Oysterous': 4500,  // 1 sleaze res, 20 turns
    'Sleaze-Resistant Trousers': 2000, // 1 stench res, 10 turns               
};

// Map the islands to the res you should grab.
const ISLANDRESMAP = {
    "easter":"stench",
    "patrick":"sleaze",
    "thanks":"hot",             // this is a guess
    "xmas":"cold",              // this is a guess
    "vets":"spooky",            // this is a guess
};

// Map the correct dread food/drink to the right element
    //                     COL HOT STE SLE SPO
    //   Dreadful Chill =>          X   X      => Cold Pocket,  Cold-Fashioned
    //   Dreadful Heat  =>  X               X  => Hot Pocket, Hot Toddy
    //   Dreadful Fear  =>  X           X      => Spooky Pocket, Grimlet
    //   Dreadful Sheen =>      X   X          => Sleaze Pocket, Slithery Nipple
    //   Dreadful Smell =>      X           X  => Stink Pocket, Dank and Stormy

    const DREADDRINK = {
        "Dreadful Chill":"Dreadsylvanian Cold-Fashioned",
        "Dreadful Heat":"Dreadsylvanian Hot Toddy",
        "Dreadful Fear":"Dreadsylvanian Grimlet",
        "Dreadful Sheen":"Dreadsylvanian Slithery Nipple",
        "Dreadful Smell":"Dreadsylvanian Dank and Stormy",
    };

    const DREADPOCKET = {
        "Dreadful Chill":"Dreadsylvanian Cold Pocket",
        "Dreadful Heat":"Dreadsylvanian Hot Pocket",
        "Dreadful Fear":"Dreadsylvanian Spooky Pocket",
        "Dreadful Sheen":"Dreadsylvanian Sleaze Pocket",
        "Dreadful Smell":"Dreadsylvanian Stink Pocket",
    };

// Buffs cast by the user; if you don't have one, comment it out I guess.
const CASTBUFFS = [
    toEffect('Elemental Saucesphere'),
    toEffect('Astral Shell'),
    toEffect('Smooth Movements'),
    toEffect("Singer's Faithful Ocelot"),
    toEffect("Empathy"),
    toEffect("Blood Bond"),
    toEffect("Leash of Linguini"),
    toEffect("Blood Bubble"),
    toEffect("Springy Fusilli"),
    toEffect("Scarysauce"),
    toEffect("The Sonata of Sneakiness"),
    toEffect("Phat Leon's Phat Loot Lyric"),
];

/**
 * Startup tasks when script begins.
 */
function ahoyMaties() {
    if (getProperty("horseryAvailable") === "true") {
        // Marginally prefer pale horse because NC is easier to cap.
        if (getProperty("_horsery") != "pale horse") cliExecute("horsery pale horse");
    }

    // Grab a fish hatchet from the floundry.
    if (getProperty("_floundryItemCreated") === "false") {
        cliExecute("acquire 1 fish hatchet");
    }

    // Grab a deft pirate hook.
    if (itemAmount(toItem("deft pirate hook")) === 0 && equippedAmount(toItem("deft pirate hook")) === 0) {
        // TODO: This doesn't work! Probably need a visiturl. 
        // if (toItem("TakerSpace letter of Marque") in getCampground()) {
        //     cliExecute("acquire 1 deft pirate hook");
        // }
    }

    // Properly set up your retrocape.
    if (getProperty("retroCapeSuperhero") != "vampire" && getProperty("retroCapeWashingInstructions") != "hold") {
        cliExecute("retrocape vampire hold");
    }

    // For simplicity, just use peace turkey.
    useFamiliar(toFamiliar("Peace Turkey"));

    // Get the barrel buff, if you have it.
    if (getProperty("barrelShrineUnlocked") === true) {
        if (getProperty("_barrelPrayer") === "false") cliExecute("barrelprayer buff");
    }

    // Use milk. 
    use(toItem("Milk of Magnesium"));
}

/**
 * Execute sources for buffs up to a given # of turns.
 * @param {number} turns        # of turns to buff to
 * @param {Effect[]} buffs      buffs to execute 
 */
function executeBuffs(turns, buffs) {
    // I wish this batch submitted
    buffs.forEach((buff) => {
        
        // Ensure the buff isn't some stupid empty element
        if (typeof buff.default === 'string') {

            // Iterate until you have the desired # of turns of the buff
            for (let i = 0; haveEffect(buff) < turns; i++ ) {
                
                // Use the dumb cli execute strategy
                cliExecute("try; "+ buff.default);

                // If it goes WAY too hard, shut the thing off and alert user.
                if (i > 100) {
                    abort("Attempts to gain "+buff+" failed. A lot!!! Comment it out and try again?");
                }
            }
        }
    });
}

/**
 * Accepts a list of buff/val pairs and generates an Effect[] list
 * of buffs within acceptable price ranges.
 * @returns {Effect[]} buffs    properly-priced buffs
 */
function effectFilter(buffValPairs) {
    var properPriceBuffs = [];

    // Then, make sure item buffs are acceptable prices. If so, use them.
    Object.keys(buffValPairs).forEach((buffString) => {
        var buff = toEffect(buffString);
        var buffItem = toItem(buff.default.split("1")[1]);
        var buffPrice = mallPrice(buffItem);
        if (buffPrice > buffValPairs[buff]) {
            print(buff+" source, "+buffItem+" is "+price+" meat -- that's too rich for our blood.");
        } else {
            properPriceBuffs.push(buff);
        }
    });

    return properPriceBuffs;

}

/**
 * Iterates through a series of buff/price points and adds them to a broader 
 *   effect list to put into executeBuffs
 * @returns {Effect[]} buffs    cost-effective buffs to pick up
 */
function priceCheck(island) {

    // First, load up your casting buffs; you always want to check those.
    var buffList = CASTBUFFS;
    var userNC = numericModifier("Combat Rate");
    var userRES = numericModifier(toElement(ISLANDRESMAP[island])+" resistance");

    // If the user isn't already capping, check buff lists. Otherwise, skip.
    if (userNC  > -35) buffList = buffList.concat(effectFilter(NCBUFFS));
    if (userRES <  40) {
        buffList = buffList.concat(effectFilter(RESBUFFS));
        if (ISLANDRESMAP[island] === "stench") buffList = buffList.concat(effectFilter(STENCHBUFFS));
        if (ISLANDRESMAP[island] === "sleaze") buffList = buffList.concat(effectFilter(SLEAZEBUFFS));
    }

    // Return the list for execution.
    return buffList;
}

/**
 * Function that checks if something is equipped and if so does 
 *   nothing. Else, it equips it.
 */
function checkThenEquip(slot,item) {
    if (equippedItem(toSlot(slot)) === item) return;
    if (itemAmount(item) < 1) abort("You do not have a "+item.name+"... comment it out?");
    equip(toSlot(slot),item);
}

/**
 * Function used to ensure you are outfitted appropriately.
 */
function manageEquipment() {
    // Start with the base outfit you are using most of the day.
    checkThenEquip("hat",toItem("Crown of Thrones"));
    checkThenEquip("back",toItem("unwrapped knock-off retro superhero cape"));
    checkThenEquip("shirt",toItem("Jurassic Parka"));
    checkThenEquip("weapon",toItem("fish hatchet"));
    checkThenEquip("off-hand",toItem("deft pirate hook"));
    checkThenEquip("pants",toItem("pantsgiving"));
    checkThenEquip("acc1",toItem("mafia thumb ring"));
    checkThenEquip("acc2",toItem("Retrospecs"));
    checkThenEquip("acc3",toItem("Pocket Square of Loathing"));

    // Ensure parka's equipped if YR is up.
    if (haveEffect(toEffect("Everything Looks Yellow")) < 1) 
        equip(toItem("Jurassic Parka"));

    // Ensure darts are equipped for bullseyes if they're up.
    if (haveEffect(toEffect("Everything Looks Red")) < 1)
        checkThenEquip("acc3",toItem("Everfull Dart Holster"));
}

/**
 * Eat/drink the "right" dread food/drink to get the massive +res boosts.
 * @param {string} island    the island you will be adventuring at
 */
function chompSomeDread(islandToRun, turnsToRun) {
    // There are two dread consumables for each element, giving you a total 
    //   of +10 res if you achieve both.

    // Here are the element mappings:
    //                     COL HOT STE SLE SPO
    //   Dreadful Chill =>          X   X      => Cold Pocket,  Cold-Fashioned
    //   Dreadful Heat  =>  X               X  => Hot Pocket, Hot Toddy
    //   Dreadful Fear  =>  X           X      => Spooky Pocket, Grimlet
    //   Dreadful Sheen =>      X   X          => Sleaze Pocket, Slithery Nipple
    //   Dreadful Smell =>      X           X  => Stink Pocket, Dank and Stormy

    if (islandToRun=="easter")    var dreadEffects = ["Dreadful Chill", "Dreadful Sheen"];
    if (islandToRun=="patrick")   var dreadEffects = ["Dreadful Chill", "Dreadful Fear"];
    // if (island="easter") var dreadEffects = ["Dreadful Chill", "Dreadful Fear"];
    // if (island="easter") var dreadEffects = ["Dreadful Chill", "Dreadful Fear"];
    // if (island="easter") var dreadEffects = ["Dreadful Chill", "Dreadful Fear"];

    // Iterate through the island's two feelings, capping the first then the second.
    dreadEffects.forEach((dreadFeeling) => {
        // Even with maximal space, you're looking at 3 food & 5 drinks.
        for (let i = 0; i < 8; i++) {
            // Only eat if you have 4+ fullness left.
            if (fullnessLimit() - myFullness() >= 4) {
                
                // Only eat if you don't have sufficient turns yet.
                if(haveEffect(toEffect(dreadFeeling)) < turnsToRun) eat(toItem(DREADPOCKET[dreadFeeling]));
            }
            // Only drink if you have 4+ inebriety left.
            if (inebrietyLimit() - myInebriety() >= 4) {

                // Only drink if you don't have sufficient turns yet.
                if(haveEffect(toEffect("Ode to Booze"))<4) useSkill(1, toSkill("The Ode to Booze"));
                if(haveEffect(toEffect(dreadFeeling)) < turnsToRun) drink(toItem(DREADDRINK[dreadFeeling]));
            }
        }
    });
}


function main(cmd) {

    var turnsToRun = 0;
    var islandToRun = "easter";
    var doNotAdventure = false;

    if (cmd.includes("help")) {
        print("---------------------------------------------");
        print("====== > YO HO HO 2024 !!!!");
        print("---------------------------------------------");
        print("");
        print("This is an extremely simplistic crimbo script. Here are currently supported commands:");
        print("");
        print(" - help ... this output");
        print(" - CONSUME ... trust this script to eat/drink for you, via soolar's CONSUME & some dread stuff.");
        print(" - setup=100 ... sets you up for 100 turns, but doesn't run them or eat. change 100 to any int.");
        print(" - turns=100 ... runs 100 turns. change 100 to any int");
        print(" - island=patrick ... sets your island. Options are [patrick, easter]");
        print("");
        print("Please contribute to this script on GitHub if you want it to have more features. It sucks right now!");

    } else {
        
        if (cmd.includes("turns")) {
            cmd.split(" ").forEach((cmdlet) => {
                if (cmdlet.includes("=")) {
                    if (cmdlet.split("=")[0] === "turns") {
                        turnsToRun = toInt(cmdlet.split("=")[1]);
                    }
                }   
            });
        }
        if (cmd.includes("setup")) {
            doNotAdventure = true;
            cmd.split(" ").forEach((cmdlet) => {
                if (cmdlet.includes("=")) {
                    if (cmdlet.split("=")[0] === "setup") {
                        turnsToRun = toInt(cmdlet.split("=")[1]);
                    }
                }   
            });
        }
    
        if (cmd.includes("island")) {
            cmd.split(" ").forEach((cmdlet) => {
                if (cmdlet.includes("=")) {
                    if (cmdlet.split("=")[0] === "island") {
                        islandToRun = cmdlet.split("=")[1];
                    }
                }   
            });
        }
        
        ahoyMaties();
        manageEquipment();

        // Only chomp if they are adventuring; only CONSUME if they need to.
        if (cmd.includes("CONSUME") && !doNotAdventure) {
            chompSomeDread(islandToRun, turnsToRun);
            if (myAdventures < turnsToRun - 50) cliExecute("CONSUME ALL NOMEAT VALUE 10000");
        }
    
        var buffsToSnag = priceCheck(islandToRun);
    
        executeBuffs(turnsToRun, buffsToSnag);

        var userNC = numericModifier("Combat Rate");
        var userRES = numericModifier(toElement(ISLANDRESMAP[islandToRun])+" resistance");
        print("After setup, you are at "+userNC+" combat rate and "+userRES+" targeted resistance.");
        if (userNC > -35) {
            var expectedNCsMissed = ((35+userNC)/100.0)*turnsToRun;
            var expectedLoss = expectedNCsMissed*(VALUEOFSPIRIT*(11-2));
            print( "... you are leaving "+expectedLoss.toFixed(0)+" meat on the table via insufficient NC.");
        }
        if (userRES < 40) {
            var expectedLoss = ((userNC/100)*turnsToRun)*(.275)*(40-userRES)*(VALUEOFSPIRIT);
            print( "... you are leaving "+Math.abs(expectedLoss.toFixed(0))+" meat on the table via insufficient RESISTANCE.");
        }

    }


}

module.exports.main = main;