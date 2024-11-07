/*
 * Script Name: Fake Script Client
 * Version: v1.2.3
 * Last Updated: 2024-01-30
 * Author: RedAlert
 * Author URL: https://twscripts.dev/
 * Author Contact: redalert_tw (Discord)
 * Approved: N/A
 * Approved Date: 2022-04-24
 * Mod: JawJaw
 */

/*--------------------------------------------------------------------------------------
 * This script can NOT be cloned and modified without permission from the script author.
 --------------------------------------------------------------------------------------*/

// User Input
if (typeof DEBUG !== 'boolean') DEBUG = false;
if (typeof config !== 'object') config = null;

// Script Config
var scriptConfig = {
    scriptData: {
        prefix: 'fakeScriptClient',
        name: 'Fake Script Client',
        version: 'v1.2.3',
        author: 'RedAlert',
        authorUrl: 'https://twscripts.dev/',
        helpLink:
            'https://forum.tribalwars.net/index.php?threads/fake-script-client.288771/',
    },
    translations: {
        en_DK: {
            'Fake Script Client': 'Fake Script Client',
            Help: 'Help',
            'You need to provide a configuration to run this script!':
                'You need to provide a configuration to run this script!',
            'Redirecting...': 'Redirecting...',
            'All villages were extracted, now start from the first!':
                'All villages were extracted, now start from the first!',
            'Invalid configuration provided!':
                'Invalid configuration provided!',
            'No more troops to send. Going to next village...':
                'No more troops to send. Going to next village...',
        },
    },
    allowedMarkets: [],
    allowedScreens: ['place'],
    allowedModes: [],
    isDebug: DEBUG,
    enableCountApi: false,
};

if (typeof window.twSDK === 'undefined') {
    jQuery.ajax({
        type: 'GET',
        url: `https://twscripts.dev/scripts/twSDK.js?url=${document.currentScript.src}`,
        success: initFakeScript,
        dataType: 'script',
        cache: true,
    });
} else {
    initFakeScript();
}

async function initFakeScript() {
    await twSDK.init(scriptConfig);
    const scriptInfo = twSDK.scriptInfo();
    const gameScreen = twSDK.getParameterByName('screen');
    const gameMode = twSDK.getParameterByName('try');

    // Check that there is a script config provided
    if (config === null) {
        UI.ErrorMessage(
            twSDK.tt('You need to provide a configuration to run this script!')
        );
        return;
    }

    const isCorrectScreen = gameScreen === 'place' && gameMode === null;
    if (!isCorrectScreen) {
        UI.InfoMessage(twSDK.tt('Redirecting...'));
        twSDK.redirectTo('place');
    }

    // Entry Point
    const { villages, players, tribes, worldConfig } = await fetchWorldData();

    const coordinates = twSDK.getDestinationCoordinates(
        config,
        tribes,
        players,
        villages
    );

    runScript(config, coordinates);

    // Here is where the fake script does it's work
    function runScript(config, coordinates) {
        const { sendMode, unitsAndAmounts, whatSend } = config;

        // prepare transformed unit amounts object
        let unitAmountsTransformed = {};
        unitsAndAmounts.forEach((item) => {
            const { unit, amount } = item;
            unitAmountsTransformed = {
                ...unitAmountsTransformed,
                [unit]: amount,
            };
        });

        // fill target field
        if (sendMode === 'sequential') {
            index = 0;
            fakecookie = document.cookie.match('(^|;) ?farm=([^;]*)(;|$)');
            if (fakecookie != null) index = parseInt(fakecookie[2]);
            if (index >= coordinates.length)
                UI.ErrorMessage(
                    twSDK.tt(
                        'All villages were extracted, now start from the first!'
                    )
                );
            if (index >= coordinates.length) index = 0;
            coordinates = coordinates[index];
            coordinates = coordinates.split('|');
            index = index + 1;
            cookie_date = new Date(2050, 1, 1);
            document.cookie =
                'farm=' + index + ';expires=' + cookie_date.toGMTString();
            document.getElementById('inputx').value = coordinates[0];
            document.getElementById('inputy').value = coordinates[1];
        } else if (sendMode === 'random' || sendMode === 'selective_random') {
            const randomIndex = Math.floor(Math.random() * coordinates.length);
            const coordSplit = coordinates[randomIndex].split('|');
            document.getElementById('inputx').value = coordSplit[0];
            document.getElementById('inputy').value = coordSplit[1];
        }

        // fill unit fields
        getWhatUnitsToSend(whatSend, unitAmountsTransformed);
    }

    // Helper: What units to send
    function getWhatUnitsToSend(whatSend, unitsAndAmounts) {
        let totalTroops = 0;
        Array.from(document.querySelectorAll('.unitsInput')).forEach(function (
            x
        ) {
            x.value = 0;
            totalTroops += +x.getAttribute('data-all-count');
        });

        if (totalTroops === 0) {
            goToNextVillage();
        }

        const spyCount = twSDK.getTroop('spy');
        const ramsCount = twSDK.getTroop('ram');
        const catsCount = twSDK.getTroop('catapult');

        switch (whatSend) {
            case 'custom':
                var count;
                for (var unit in unitsAndAmounts) {
                    if (unitsAndAmounts.hasOwnProperty(unit)) {
                        if (
                            unitsAndAmounts[unit] > 0 &&
                            typeof document.forms[0][unit] != 'undefined'
                        ) {
                            count = document
                                .getElementById(`unit_input_${unit}`)
                                .getAttribute('data-all-count');
                            if (count > 0 && unitsAndAmounts[unit] < count) {
                                document.forms[0][unit].value = Math.min(
                                    unitsAndAmounts[unit],
                                    count
                                );
                            } else {
                                goToNextVillage();
                            }
                        }
                    }
                }
                break;
            case 'selective_send_all':
                var count;
                for (var unit in unitsAndAmounts) {
                    if (unitsAndAmounts.hasOwnProperty(unit)) {
                        count = document
                            .getElementById(`unit_input_${unit}`)
                            .getAttribute('data-all-count');
                        document.forms[0][unit].value = Math.abs(
                            count - unitsAndAmounts[unit]
                        );
                    }
                }
                break;
            case 'send_all':
                if (totalTroops > 0) {
                    selectAllUnits(1);
                } else {
                    goToNextVillage();
                }
                break;
            case 'ram_then_catapult':
                if (ramsCount >= 1) {
                    document.getElementById('unit_input_ram').value = 1;
                    if (spyCount >= 1) {
                        document.getElementById('unit_input_spy').value = 1;
                    }
                } else if (catsCount >= 1) {
                    document.getElementById('unit_input_catapult').value = 1;
                    if (spyCount >= 1) {
                        document.getElementById('unit_input_spy').value = 1;
                    }
                } else {
                    goToNextVillage();
                }
                break;
            case 'catapult_then_ram':
                if (catsCount >= 1) {
                    document.getElementById('unit_input_catapult').value = 1;
                    if (spyCount >= 1) {
                        document.getElementById('unit_input_spy').value = 1;
                    }
                } else if (ramsCount >= 1) {
                    document.getElementById('unit_input_ram').value = 1;
                    if (spyCount >= 1) {
                        document.getElementById('unit_input_spy').value = 1;
                    }
                } else {
                    goToNextVillage();
                }
                break;
            case 'fake_limit':
                fillUnitAmountsFakeLimitWorld();
                break;
            default:
                UI.ErrorMessage(twSDK.tt('Invalid configuration provided!'));
                return;
        }
    }

    // Helper: Move to next village
    function goToNextVillage() {
        setTimeout(function () {
            const nextVillageLink = document
                .getElementById('village_switch_right')
                ?.getAttribute('href');

            if (nextVillageLink) {
                UI.InfoMessage(
                    twSDK.tt('No more troops to send. Going to next village...')
                );
                window.location.assign(nextVillageLink);
            }
        }, 500);
    }

    // Helper: Fill unit amounts on fake limit worlds
    function fillUnitAmountsFakeLimitWorld() {
        let fakeLimit = parseInt(worldConfig.config.game.fake_limit) || 1;
        let fakePop = Math.floor((game_data.village.points * fakeLimit) / 100);
        let maxScouts = 5;

        let cats = twSDK.getTroop('catapult');
        let rams = twSDK.getTroop('ram');
        let scouts = twSDK.getTroop('spy');
        let light = twSDK.getTroop('light') * 4;
        let spear = twSDK.getTroop('spear');
        let sword = twSDK.getTroop('sword');
        let axe = twSDK.getTroop('axe');

        if (cats > 0) {
            document.forms[0].catapult.value = 1;
            fakePop = fakePop - 8;
        } else {
            if (rams > 0) {
                document.forms[0].ram.value = 1;
                fakePop = fakePop - 5;
            }
        }

        if (scouts > 0) {
            if (fakePop < 1) {
                scouts = 1;
            } else {
                if (scouts > maxScouts) {
                    scouts = maxScouts;
                }
            }
            document.forms[0].spy.value = scouts;
            fakePop = fakePop - scouts * 2;
        }

        if (fakePop > 0) {
            if (light > 0 && fakePop > 0) {
                if (light * 4 >= fakePop) {
                    light = Math.ceil(fakePop / 4);
                }
                document.forms[0].light.value = light;
                fakePop = fakePop - (light * 4);
            }
            if (axe > 0 && fakePop > 0) {
                if (axe >= fakePop) {
                    axe = fakePop;
                }
                document.forms[0].axe.value = axe;
                fakePop = fakePop - axe;
            }
            if (spear > 0 && fakePop > 0) {
                if (spear >= fakePop) {
                    spear = fakePop;
                }
                document.forms[0].spear.value = spear;
                fakePop = fakePop - spear;
            }
            if (sword > 0 && fakePop > 0) {
                if (sword >= fakePop) {
                    sword = fakePop;
                }
                document.forms[0].sword.value = sword;
                fakePop = fakePop - sword;
            }
        }
    }

    // Helper: Fetch all required world data
    async function fetchWorldData() {
        if (!isCorrectScreen) return;
        try {
            const villages = await twSDK.worldDataAPI('village');
            const players = await twSDK.worldDataAPI('player');
            const tribes = await twSDK.worldDataAPI('ally');
            const worldConfig = await twSDK.getWorldConfig();
            return { villages, players, tribes, worldConfig };
        } catch (error) {
            UI.ErrorMessage(error);
            console.error(`${scriptInfo} Error:`, error);
        }
    }
}