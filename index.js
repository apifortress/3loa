const request       = require ('request');
const puppeteer     = require ('puppeteer');
const express       = require ('express');
const bodyParser    = require ('body-parser');


const PORT          = process.env.PORT || 3000;
const app           = express ();




const fb_demo = () => {
    return new Promise ((resolve, reject) => {
        const opts = {
            "username": "",
            "password": "",
        
            "usernameField": "#login_form input[name=\"email\"]",
            "passwordField": "#login_form input[name=\"pass\"]",
            "loginButton": "#login_form #loginbutton",
            "authorizeButton": "#platformDialogForm button[name=\"__CONFIRM__\"]",
        
            "authorizationURL": "",
            "tokenURL": ""
        }
        OAuth (opts).then (resolve);
    })
}

const OAuth = (opts) => {
    return new Promise ((resolve, reject) => {
        oauth_authorization (opts).then ((code) => {
            if (code)
                oauth_token ({ ...opts, ...{ code: code } }).then (resolve);
            else
                resolve ({ success: false, error: 'Unable to get auth code.' });
        })
    })
}

const oauth_authorization = (opts) => {
    return new Promise ((resolve, reject) => {
        (async () => {
            let code        = null;
            const browser   = await puppeteer.launch ({executablePath: 'google-chrome-unstable',args: [
                                                        '--no-sandbox',
                                                        '--disable-setuid-sandbox',
                                                        '--disable-dev-shm-usage'
                                                        ]})
            const page      = await browser.newPage ()
            
            await page.goto (opts.authorizationURL);
            const login_field = await page.$(opts.usernameField);

            if (login_field) {
                await page.focus (opts.usernameField);
                await page.type (opts.usernameField, opts.username);

                await page.focus (opts.passwordField);
                await page.type (opts.passwordField, opts.password);
                
                
                await Promise.all ([
                    page.waitForNavigation (),
                    page.$eval (opts.loginButton, el => el.click ())
                ]);
            }

            const authorize_btn = await page.$(opts.authorizeButton);
            if (authorize_btn) {
                await Promise.all ([
                    page.waitForNavigation (),
                    page.$eval (opts.authorizeButton, el => el.click ())
                ]);
            }

            const final_url = await page.url ();
            await browser.close ();
            const query_string = final_url.substring (final_url.indexOf ('?'));

            let url_params = new URLSearchParams (query_string);
            code = url_params.has ('code') ? url_params.get ('code') : null;

            resolve (code);
        })()
    })
}

const oauth_token = (opts) => {
    return new Promise ((resolve, reject) => {
        let result      = { success: false },
            url         = new URL (opts.tokenURL),
            params      = new URLSearchParams (url.search);

        params.set ('code', opts.code);
        url.search = params.toString ();
        request ({
            type: 'GET',
            uri: url.href
        }, (e, r, b) => {
            if (e) {
                result.error = e;
                resolve (result);
            } else {
                const parsed = JSON.parse (b);
                if (parsed.error !== undefined) {
                    result = { ...result, ...parsed };
                    resolve (result);
                } else {
                    result.success = true;
                    result = { ...result, ...parsed };
                    resolve (result);
                }
            }
        });
    })
}



app.use (bodyParser.json ());

app.get ('/fbdemo', (req, res) => {
    fb_demo().then ((result) => {
        res.json (result);
    })
});

app.post ('/oauth', (req, res) => {
    OAuth (req.body).then ((result) => {
        res.json (result)
    })
});

app.listen (PORT, () => {
    console.log ('===> Server listening on', PORT);
});
