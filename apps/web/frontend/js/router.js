/*
 * WAEVE ROUTER ENGINE
 * Build: 0.2.0
 */

(function () {

    "use strict";


    const router = {

        routes: {},

        currentRoute: null,


        /*
         * REGISTER ROUTE
         */

        register(name, path) {

            if (
                typeof name !== "string" ||
                typeof path !== "string"
            ) {

                console.error(
                    "Waeve Router: Invalid route."
                );

                return;

            }


            this.routes[name] =
                path;

        },


        /*
         * NAVIGATE
         */

        async navigate(name) {

            const container =
                document.getElementById(
                    "waeve-content"
                );


            if (!container) {

                console.error(
                    "Waeve Router: Content container not found."
                );

                return;

            }


            const path =
                this.routes[name];


            if (!path) {

                console.error(
                    `Waeve Router: Route "${name}" does not exist.`
                );


                container.innerHTML = `

                    <section class="page">

                        <div class="empty-state">

                            <h2>
                                Page not found
                            </h2>

                            <p>
                                The requested Waeve page does not exist.
                            </p>

                        </div>

                    </section>

                `;

                return;

            }


            try {

                const response =
                    await fetch(path);


                if (!response.ok) {

                    throw new Error(
                        `HTTP ${response.status}: ${response.statusText}`
                    );

                }


                const html =
                    await response.text();


                container.innerHTML =
                    html;


                this.currentRoute =
                    name;


                this.updateNavigation(
                    name
                );


                console.log(
                    `Waeve Router: "${name}" loaded.`
                );


            } catch (error) {

                console.error(
                    "Waeve Router Error:",
                    error
                );


                container.innerHTML = `

                    <section class="page">

                        <div class="empty-state">

                            <h2>
                                Unable to load page
                            </h2>

                            <p>
                                Please check the Waeve local server.
                            </p>

                        </div>

                    </section>

                `;

            }

        },


        /*
         * UPDATE NAVIGATION
         */

        updateNavigation(activePage) {

            const buttons =
                document.querySelectorAll(
                    "[data-page]"
                );


            buttons.forEach(
                button => {

                    const isActive =
                        button.dataset.page ===
                        activePage;


                    button.classList.toggle(
                        "active",
                        isActive
                    );

                }
            );

        }

    };


    /*
     * Expose the router globally.
     *
     * This is important because
     * app.js and other Waeve modules
     * need access to the same router.
     */

    window.WaeveRouter =
        router;


    console.log(
        "Waeve Router 0.2.0 ready."
    );

})();