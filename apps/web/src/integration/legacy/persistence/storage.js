/*
 * WAEVE LOCAL STORAGE ENGINE
 * Build: 0.1.0
 */

const WaeveStorage = {

    save(key, value) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

            return true;

        } catch (error) {

            console.error(
                "Waeve Storage Save Error:",
                error
            );

            return false;

        }

    },


    get(key, defaultValue = null) {

        try {

            const storedValue =
                localStorage.getItem(key);

            if (storedValue === null) {

                return defaultValue;

            }

            return JSON.parse(storedValue);

        } catch (error) {

            console.error(
                "Waeve Storage Read Error:",
                error
            );

            return defaultValue;

        }

    },


    remove(key) {

        try {

            localStorage.removeItem(key);

            return true;

        } catch (error) {

            console.error(
                "Waeve Storage Remove Error:",
                error
            );

            return false;

        }

    }

};