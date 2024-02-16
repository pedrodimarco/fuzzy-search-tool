//Constantes
var TOPE = 8;
var levDistance = 2;
let langBuscador = getCookie('LANG');
let countryBuscador = getCntry();
var buscadorContainer = document.getElementsByClassName('buscador-container')[0];
var API_URL;
const skipCache = Math.floor(Math.random() * (1 - 5000)) + 1;

if (langBuscador) {
    API_URL = `api with items`;
} else {
    API_URL = 'default api with items';
}

let deviceBuscador = '';

if (navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i)) {
    deviceBuscador = 'mobile';
} else {
    deviceBuscador = 'desktop';
}

async function getJuegos() {
    try {
        let req = await fetch(API_URL);
        if (req.status === 200) {
            let res = await req.json();
            return res;
        } else {
            throw 'Error fetching';
        }
    } catch (error) {
        console.log(error);
    }
}

var json_alias = [
    {
        url: 'item-uriSufix',
        name: 'item name',
        keywords: 'associated keywords'
    }
]

var json_themes = [
    {
        nombre_pt: 'frutas',
        nombre_en: 'fruits',
        nombre_es: 'frutas',
        url_pt: '',
        url_en: '',
        url_es: '',
        img: ''
    }
]

var json_proveedores = [
    {
        nombre: 'evolution',
        url: 'url_to_provider',
        img: ''
    }
]

//Chequeo si los juegos ya están guardados en sessionStorage
async function chequear_y_guardar_items() {
    if (sessionStorage.getItem('juegos')) {
        let expiration = JSON.parse(sessionStorage.getItem('expiration'));
        let currentDate = new Date().getTime();

        if (expiration < currentDate) {
            sessionStorage.removeItem('juegos');
            sessionStorage.removeItem('expiration');

            return chequear_y_guardar_items();
        } else {
            return JSON.parse(sessionStorage.getItem('juegos'));
        }
    } else {
        let juegos = await getJuegos();
        if (juegos) {
            juegos = guardar_alias_filtrar_keys(juegos);
            let current_date = new Date().getTime();
            let expiration_date = current_date + 10000;
            sessionStorage.setItem('juegos', JSON.stringify(juegos));
            sessionStorage.setItem('expiration', JSON.stringify(expiration_date));

            return juegos;
        } else {
            juegos = [];
            return juegos;
        }
    }
}

function guardar_alias_filtrar_keys(juegos) {
    for (let i = 0; i < juegos.length; i++) {
        delete juegos[i].brandCode;
        delete juegos[i].bucket;
        delete juegos[i].contentType;
        delete juegos[i].contentId;
        delete juegos[i].publishedAt;
        delete juegos[i].uriSuffixes;
        // delete juegos[i].fields.gameId;
        delete juegos[i].fields.metafields;
        delete juegos[i].fields.page_image;
        delete juegos[i].fields.short_description;
        delete juegos[i].fields.long_description;
        // delete juegos[i].fields.custom_badge;
        delete juegos[i].fields.add_js_files;
        delete juegos[i].fields.internalName;
        delete juegos[i].fields.internal_name;
        delete juegos[i].fields.sitemapEnabled;
        delete juegos[i].fields.sitemapPriority;
        delete juegos[i].fields.version;
        for (let j = 0; j < json_alias.length; j++) {
            if (juegos[i].uriSuffix == json_alias[j].url) {
                juegos[i].alias = json_alias[j].keywords;
            }
        }
    }
    return juegos;
}

function removeDuplicated(arr) {
    return arr.filter((item, index) => arr.indexOf(item) === index);
}

function filtrarJuegosDisponibles(arr) {
    const res = arr.map(x => checkDeviceAviability(x));
    return res;
}

function checkDeviceAviability(obj) {
    const game_id = obj.fields.game_id;

    let availableMobile = false;
    let availableDesktop = false;

    game_id.forEach(element => {
        if (element.channelList.length > 0) {
            element.channelList.forEach(channelList => {
                if (channelList) {
                    if (channelList.includes('desktop')) {
                        availableDesktop = true;
                        obj.disp_desktop = true;
                    }
                    if (channelList.includes('mobile_tablet')) {
                        availableMobile = true;
                        obj.disp_mobile = true;
                    }
                }
            });
        }
    });

    return obj;
}

function newArraySorted(juegos, substr) {
    if (juegos && substr) {
        substr = normalize(substr).trim();
        juegos = filtrarJuegosDisponibles(juegos);
        let matchesArr = [];
        var topeChar = 4;

        //Match providers 
        for (let i = 0; i < json_proveedores.length; i++) {
            if (normalize(json_proveedores[i].nombre).includes(substr)) {
                json_proveedores[i].flag = 'provider'
                matchesArr.unshift(json_proveedores[i])
            }
        }

        //Match by themes
        for (let i = 0; i < json_themes.length; i++) {
            if (langBuscador == 'es') {
                if (normalize(json_themes[i].nombre_es).includes(substr)) {
                    json_themes[i].flag = 'category'
                    matchesArr.unshift(json_themes[i])
                }
            } else if (langBuscador == 'en') {
                if (normalize(json_themes[i].nombre_en).includes(substr)) {
                    json_themes[i].flag = 'category'
                    matchesArr.unshift(json_themes[i])
                }
            } else {
                if (normalize(json_themes[i].nombre_pt).includes(substr)) {
                    json_themes[i].flag = 'category'
                    matchesArr.unshift(json_themes[i])
                }
            }
        }

        //Exact match with first word
        for (let i = 0; i < juegos.length; i++) {
            if (matchesArr.length < TOPE) {
                let tituloJuego = normalize(juegos[i].fields.title.trim());
                let firstWord = tituloJuego.split(' ')[0];

                if (firstWord.includes(substr)) {
                    matchesArr.push(juegos[i]);

                    if (matchesArr.length >= TOPE) {
                        // return matchesArr
                        break;
                    }
                }
            } else {
                break;
            }
        }

        //Exact match with entire title
        for (let i = 0; i < juegos.length; i++) {
            if (matchesArr.length < TOPE) {
                let tituloJuego = normalize(juegos[i].fields.title.trim());

                if (tituloJuego.includes(substr)) {
                    matchesArr.push(juegos[i]);
                    if (matchesArr.length >= TOPE) {
                        // return matchesArr;
                        break;
                    }
                }
            } else {
                break;
            }
        }

        //Match by alias
        for (let i = 0; i < juegos.length; i++) {
            if (matchesArr.length < TOPE) {
                if (juegos[i].alias?.includes(substr)) {
                    matchesArr.push(juegos[i]);
                    if (matchesArr.length >= TOPE) {
                        // return matchesArr;
                        break;
                    }
                }
            } else {
                break;
            }
        }


        let substrArr = substr.split(' ');

        for (let i = 0; i < juegos.length; i++) {
            if (matchesArr.length < TOPE) {
                //Convert game name in array
                let tituloArr = normalize(juegos[i].fields.title.trim()).split(' ');

                loop1:
                for (let j = 0; j < tituloArr.length; j++) {

                    for (let k = 0; k < substrArr.length; k++) {

                        if (tituloArr[j].length >= topeChar && substrArr[k].length >= topeChar) {
                            if (((calculateSoundexCode(substrArr[k]) == calculateSoundexCode(tituloArr[j])) || (levenshtein(tituloArr[j], substrArr[k]) < levDistance)) && (matchesArr.indexOf(juegos[i]) == -1)) {
                                matchesArr.push(juegos[i]);
                                break loop1;
                            }
                            if (matchesArr.length >= TOPE) {
                                break loop1;
                            }
                        }
                    }
                }
                if (matchesArr.length >= TOPE) {
                    break;
                }
            } else {
                break;
            }
        }

        matchesArr = removeDuplicated(matchesArr);

        //Move not available games to the end of array (have to execute twice to respect the original order)
        matchesArr.sort((a, b) => {
            switch (deviceBuscador) {
                case 'desktop':
                    if (!a.disp_desktop) {
                        return 1
                    }
                    return -1
                    break;

                case 'mobile':
                    if (a.disp_mobile) {
                        return -1
                    }
                    if (b.disp_mobile) {
                        return 1
                    }
                    break;
            }
        })

        matchesArr.sort((a, b) => {
            switch (deviceBuscador) {
                case 'desktop':
                    if (!a.disp_desktop) {
                        return 1
                    }
                    return -1
                    break;

                case 'mobile':
                    if (a.disp_mobile) {
                        return -1
                    }
                    if (b.disp_mobile) {
                        return 1
                    }
                    break;
            }
        })

        //Move the providers and categories to the top of the array
        matchesArr.sort((a, b) => {
            if (a.flag) {
                return -1
            }
            return 1
        })

        return matchesArr;
    }
}

//Imprimir resultados en el html
function printResults(arr) {
    let https_brandSite = 'https://www.brandsite.com';

    if (langBuscador == 'es')
        https_brandSite += '/es'
    else if (langBuscador == 'en') {
        https_brandSite += '/en'
    }

    let search_input_value = document.getElementById('input_element').value;
    let inner_results = document.getElementById('inner_results');

    let inner_results_insert = '';
    let results_title = 'Resultados';
    let not_results = 'Não se acharam resultados.';

    if (langBuscador == 'es') {
        not_results = 'No se encontraron resultados.';
    }
    else if (langBuscador == 'en') {
        not_results = 'Not matches were found.';
        results_title = 'Results';
    }

    if (arr) {
        if (arr.length > 0) {
            inner_results_insert += `<h3 class='results_title'>${results_title}</h3>`;
            arr.forEach(element => {
                if (element.flag == 'category') {
                    inner_results_insert += `
          <a href='${langBuscador == 'es' ? element.url_es : langBuscador == 'en' ? element.url_en : element.url_pt}' class='result_item'>
          <li class='item_container'>
          <div class='game_info'>
              <div class='result_item_container categoria'>
                <img src='${element.img}'/>
              </div>
              <div>
                <p class='bold'>${langBuscador == 'es' ? element.nombre_es.toUpperCase() : langBuscador == 'en' ? element.nombre_en.toUpperCase() : element.nombre_pt.toUpperCase()}</p>
              </div>
          </div>
          <div class='category'>
            <span>
            ${langBuscador == 'es' ? 'CATEGORÍA' : langBuscador == 'en' ? 'CATEGORY' : 'CATEGORIA'}
            </span>
          </div>  
          </li>
        </a>
          `
                } else if (element.flag == 'provider') {
                    inner_results_insert += `
          <a href='${element.url}' class='result_item'>
          <li class='item_container'>
          <div class='game_info'>
              <div class='result_item_container proveedor'>
                <img src='${element.img}'/>
              </div>
              <div>
                
              </div>
          </div>
          <div class='category'>
            <span>
            ${langBuscador == 'es' ? 'PROVEEDOR' : langBuscador == 'en' ? 'PROVIDER' : 'FORNECEDOR'}
            </span>
          </div>  
          </li>
        </a>
          `
                } else {
                    const gameSlug = element.fields.category.slug;
                    let gameSubcategorySlug = '';

                    if (element.fields?.subcategory?.slug) {
                        gameSubcategorySlug = element.fields?.subcategory?.slug + '/';
                    }
                    let gameUrl = https_brandSite + '/casino?overlay=casino/' + gameSlug + '/' + gameSubcategorySlug + element.uriSuffix;


                    let is_available = '';

                    if (deviceBuscador == 'desktop' && !element.disp_desktop) {
                        is_available = 'no-disp-desktop';
                        gameUrl = '';
                    } else if (deviceBuscador == 'mobile' && !element.disp_mobile) {
                        is_available = 'no-disp-mobile';
                        gameUrl = '';
                    }

                    inner_results_insert += `
          <a href='${gameUrl}' class='result_item ${is_available}'>
            <li class='item_container'>
            <div class='game_info'>
                <div class='result_item_container'>
                  <img src='${element.fields.card_image.url}'/>
                </div>
                <div>
                  <p class='bold'>${element.fields.title}</p>
                </div>
            </div>
            <div class='game-categoryList'>
              <span class='span-badge'>${''}</span>
              <span class='span-category'>${element.fields.categoryList ? element.fields.categoryList.toUpperCase() :
                            element.fields.category.name ? element.fields.category.name.toUpperCase() :
                                'CASINO'}</span>
            </div>  
            </li>
          </a>
          `

                }
            })
        } else {

            inner_results_insert = `
        <div class='result_item'>
          <li class='item_container'>
          <div class='game_info'>
            <div class='result_item_container' style='height: 28px;'><i class='info icon-info' style='border-radius: 0; font-size: 24px;'></i></div>
              <div><p>${not_results}</p></div>
          </div>
            
          </li>
        </div>
        `;

            saveNotMatchedString(search_input_value);
        }
    }

    return inner_results_insert;
}

function debounce(callback, wait) {
    let timerId;
    return function (...args) {
        clearTimeout(timerId);
        timerId = setTimeout(function () {
            callback(...args);
        }, wait);
    };
}

function quitarPreload() {
    let preload = document.getElementById('preload');
    let search_icon = document.getElementsByClassName('search-icon')[0];
    let input = document.getElementById('buscador_juegos_casino');

    if (preload && search_icon) {
        preload.classList.add('ocultar');
        search_icon.classList.remove('ocultar');
        input.disabled = false;
    }
}

function buscadorCasinoIniziator() {
    console.log('iniziator')
    if (!document.getElementById('pBuscadorCasino')) {
        let p = document.createElement('p');
        let body = document.getElementsByTagName('body')[0]
        body.appendChild(p)
        p.setAttribute('id', 'pBuscadorCasino');
        start_buscador()
    }
}

async function start_buscador() {
    let juegos = await chequear_y_guardar_items();
    quitarPreload();
    var from_input = true;

    setInterval(async function () {
        juegos = await chequear_y_guardar_items()
        return juegos;
    }, 1000 * 60 * 5); // 5 minutos

    let search_icon = document.getElementsByClassName('search-icon')[0];
    let closeButton = document.getElementsByClassName('icon-close')[0];
    let inner_results = document.getElementById('inner_results');
    let search_input = document.getElementById('buscador_juegos');

    if (search_input && search_icon && closeButton && inner_results) {
        search_input.addEventListener('keydown', function () {
            if (search_input.value.length > 0) {
                closeButton.classList.remove('ocultar');
            } else {
                closeButton.classList.add('ocultar');
            }
        })

        //Muestra resultados despues de 250ms
        search_input.addEventListener('input', debounce(function () {
            if (search_input.value.length >= 3) {
                from_input = true;
                touch_out = false;
                let search_input_value = search_input.value;
                var results = newArraySorted(juegos, search_input_value);
            }

            inner_results.innerHTML = printResults(results);
        }, 300))

        //Guardar registro pasado 1s 
        search_input.addEventListener('keyup', debounce(async function () {
            if (search_input.value.length >= 3) {
                await createRow(search_input.value);
            }
        }, 1000))

        search_input.addEventListener('keyup', function (e) {
            e.preventDefault();
            if (e.key === 'Enter') {
                from_input = false;
                touch_out = true;
                search_input.blur();
            }
        })

        search_icon.addEventListener('click', function (e) {
            e.preventDefault();
            from_input = false;
            search_input.blur();
        })

        window.onscroll = function (e) {
            // consola2('scroll')
            if (from_input == true) {
                if (search_input.value.length >= 3) {
                    let search_input_value = search_input.value;
                    // var results = newArraySorted(juegos, search_input_value);
                    // inner_results.innerHTML = printResults(results);
                    search_input.blur();
                } else {
                    inner_results.innerHTML = '';
                    search_input.blur();
                }
            }
        }

        var touch_out = false;

        window.addEventListener('click', function (e) {
            //Si hubo click en la lupa
            if (search_icon.contains(e.target)) {
                if (search_input.value.length >= 3) {
                    let search_input_value = search_input.value;
                    var results = newArraySorted(juegos, search_input_value);
                    inner_results.innerHTML = printResults(results);
                }
                search_input.blur();
                touch_out = true;

                //Si hubo click en la cruz
            } else if (closeButton.contains(e.target)) {
                search_input.value = '';
                inner_results.innerHTML = '';
                touch_out = true;
                closeButton.classList.add('ocultar');


            }
            //Si el click es en el input
            else if (search_input.contains(e.target)) {
                touch_out = false;
                // search_input.focus();
                // search_input.focus()
            }

            //Si el click fue afuera del contenedor del buscador
            else {
                if (inner_results.innerHTML != '') {
                    if (touch_out == false) {
                        touch_out = true
                        search_input.blur()
                    } else {
                        inner_results.innerHTML = ''
                        touch_out = true
                    }
                } else {
                    search_input.blur()
                }
            }
        })

        search_input.addEventListener('select', () => {
            search_input.focus()
        })
    }


}

//Remover caracteres especiales, tildes, apostrofes
function normalize(str) {
    if (str) {
        str = str.replace(/'/, '');
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }
}

function getCookie(cname) {
    var name = cname + '=';
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
}

function getCookieVariant(cname) {
    let name = cname + '=';
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length).split('|'); //Retorna array
        }
    }
    return '';
}

function getCntry() {
    return getCookieVariant('variant').find(x => x.split(':')[0] == 'cntry').split('cntry:')[1];
}

function get_account_number() {
    const logged = localStorage.getItem('customerId');
    if (logged) {
        return JSON.parse(logged).value;
    } else {
        return false;
    }
}

//Levenshtein distance
function levenshtein(s, t) {
    if (s === t) {
        return 0;
    }
    var n = s.length, m = t.length;
    if (n === 0 || m === 0) {
        return n + m;
    }
    var x = 0, y, a, b, c, d, g, h, k;
    var p = new Array(n);
    for (y = 0; y < n;) {
        p[y] = ++y;
    }

    for (; (x + 3) < m; x += 4) {
        var e1 = t.charCodeAt(x);
        var e2 = t.charCodeAt(x + 1);
        var e3 = t.charCodeAt(x + 2);
        var e4 = t.charCodeAt(x + 3);
        c = x;
        b = x + 1;
        d = x + 2;
        g = x + 3;
        h = x + 4;
        for (y = 0; y < n; y++) {
            k = s.charCodeAt(y);
            a = p[y];
            if (a < c || b < c) {
                c = (a > b ? b + 1 : a + 1);
            }
            else {
                if (e1 !== k) {
                    c++;
                }
            }

            if (c < b || d < b) {
                b = (c > d ? d + 1 : c + 1);
            }
            else {
                if (e2 !== k) {
                    b++;
                }
            }

            if (b < d || g < d) {
                d = (b > g ? g + 1 : b + 1);
            }
            else {
                if (e3 !== k) {
                    d++;
                }
            }

            if (d < g || h < g) {
                g = (d > h ? h + 1 : d + 1);
            }
            else {
                if (e4 !== k) {
                    g++;
                }
            }
            p[y] = h = g;
            g = d;
            d = b;
            b = c;
            c = a;
        }
    }

    for (; x < m;) {
        var e = t.charCodeAt(x);
        c = x;
        d = ++x;
        for (y = 0; y < n; y++) {
            a = p[y];
            if (a < c || d < c) {
                d = (a > d ? d + 1 : a + 1);
            }
            else {
                if (e !== s.charCodeAt(y)) {
                    d = c + 1;
                }
                else {
                    d = c;
                }
            }
            p[y] = d;
            c = a;
        }
        h = d;
    }

    return h;
}

var findStartingCode = function (word) {
    return word[0].toUpperCase();
};

var findLetterCode = function (letter) {
    switch (letter.toUpperCase()) {
        case 'B':
        case 'F':
        case 'P':
        case 'V':
            return '1';

        case 'C':
        case 'G':
        case 'J':
        case 'K':
        case 'Q':
        case 'S':
        case 'X':
        case 'Z':
            return '2';

        case 'D':
        case 'T':
            return '3';

        case 'L':
            return '4';

        case 'M':
        case 'N':
            return '5';

        case 'R':
            return '6';

        default:
            return null;
    }
};

var calculateSoundexCode = function (word) {
    if (word) {
        let wordCode = findStartingCode(word);
        let lastCode = findLetterCode(wordCode); // wordCode contains one letter at the begining
        for (let i = 1; i < word.length; ++i) {
            var letterCode = findLetterCode(word[i]);
            if (letterCode && letterCode != lastCode) {
                wordCode += letterCode;
                if (wordCode.length == 4) {
                    break;
                }
            }
            lastCode = letterCode;
        }
        for (let i = wordCode.length; i < 4; ++i) {
            wordCode += '0';
        }
        return wordCode;
    }
    return null;
}

// API
async function createRow(input) {
    let formData = new FormData();
    input = input.trim();

    formData.append('country', countryBuscador);
    formData.append('device', deviceBuscador);
    formData.append('search_input', input + ' ;');

    const req = await fetch('endpoint', {
        method: 'POST',
        body: formData
    })
    const res = await req.text();
    return res;

}

async function saveNotMatchedString(input) {

    let formData = new FormData();
    input = input.trim();

    formData.append('country', countryBuscador);
    formData.append('device', deviceBuscador);
    formData.append('search_input', input + ' ;');

    const req = await fetch('api endpoint', {
        method: 'POST',
        body: formData
    })
    const res = await req.text();
    return res;
}

start_buscador()