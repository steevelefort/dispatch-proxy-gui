const {
    exec,
    execFile,
    spawn
} = require('child_process');
var kill = require('tree-kill');
// const {
//     ipcRenderer
// } = require('electron');

const Vue = require('vue/dist/vue');


const vue = new Vue({
    el: "#app",
    data: {
        autostart: false,
        isRunning: false,
        adresses: [],
        spawn: null,
        logs: [],
    },
    methods: {
        list() {
            const child = execFile('dispatch.cmd', ['list'], (error, stdout, stderr) => {
                if (error) {
                    throw error;
                }

                //stdout = stdout.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

                const regex = /([^ \n][^\n]*)\n.*?(([0-9.]*) \(IPv4\))\n\n/sg;

                const str = purgeString(stdout);
                let m;
                let adresses = [...this.adresses];

                while ((m = regex.exec(str)) !== null) {
                    // This is necessary to avoid infinite loops with zero-width matches
                    if (m.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }

                    //console.log(m[1],":",m[3]);
                    const name = m[1];
                    const ip = m[3];

                    const item = adresses.find(e => e.name == name);

                    if (item === undefined) {
                        adresses.push({
                            isOn: true,
                            name: name,
                            ip: ip,
                            ratio: 1,
                            exists: true,
                            isLoading: false
                        });
                    } else {
                        item.ip = ip;
                        item.exists = true;
                    }


                }

                this.adresses = adresses;

            });

        },
        run() {

            this.save();
            this.isRunning = true;

            let args = ["start"];
            for (adress of this.adresses) {
                if (adress.isOn) {
                    args.push(adress.ip + "@" + adress.ratio);
                }
            }

            this.spawn = spawn('dispatch.cmd', args);
            //ipcRenderer.send("spawn", this.spawn);

            this.spawn.stdout.on('data', (data) => {
                //console.log(`stdout: ${data}`);
                this.log("info", data.toString());
            });

            this.spawn.stderr.on('data', (data) => {
                //console.error(`stderr: ${data}`);
                this.log("error", data.toString());
            });

            this.spawn.on('close', (code) => {
                //console.log(`child process exited with code ${code}`);
                if (this.isRunning) {
                    this.list();
                    this.log("error", "Proxy closed, try to run it again ...");
                    this.run();
                }
            });

        },
        stop() {
            this.isRunning = false;
            this.log("info", "Stop ... ");
            kill(this.spawn.pid, 'SIGKILL', function (err) {
                console.log(err);
                this.spawn = null;
            });
            //this.spawn.stdin.pause();
            //this.spawn.kill();
            this.log("info", "Proxy stopped");
        },
        log(type, message) {
            this.logs.push({
                type: type,
                message: purgeString(message)
            });
            this.$refs.logs.scrollTop = this.$refs.logs.scrollHeight;

            const regex = /^\[DEBUG][^>]*> ([0-9.]*):[0-9]*/gm;
            let m;

            while ((m = regex.exec(message)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }

                const ip = m[1];
                //console.log("IP DETECTED "+ip);

                const item = this.adresses.find(i => ip == i.ip);
                //console.log(item);

                for (adress of this.adresses) {
                    adress.isLoading = false;
                }

                if (item != undefined) {
                    item.isLoading = true;
                    setTimeout(() => {
                        item.isLoading = false;
                        this.$forceUpdate();
                    }, 100);
                }
            }
        },
        save() {
            localStorage.setItem("adresses", JSON.stringify(this.adresses));
            localStorage.setItem("autostart", JSON.stringify(this.autostart));
        },
        load() {
            if (localStorage.adresses !== undefined) {
                this.adresses = JSON.parse(localStorage.adresses);
            }
            if (localStorage.autostart !== undefined) {
                this.autostart = JSON.parse(localStorage.autostart);
            }
        }
    },
    mounted() {
        this.load();
        this.list();
        if (this.autostart) this.run();

        window.addEventListener('close', (e)=>{
            console.log("On ferme");
        });
        window.onbeforeunload = (e) => {

            //console.log("Try to close");
            if (this.isRunning) {
                e.returnValue = false;
                this.stop();
            }

            //var answer = confirm('Do you really want to close the application?');
            //e.returnValue = false; // this will *prevent* the closing no matter what value is passed
            //if(answer) { win.destroy(); }  // this will close the app            

        };
    }
});


function purgeString(str) {
    return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

// Prevent Closing when work is running