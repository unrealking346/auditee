/*
 * ============================================================
 * WAEVE STORAGE ENGINE
 * Build: 1.0.0
 * ============================================================
 */

const WaeveStorage = {

    key(name) {

        return `${WAEVE_CONFIG.storage.prefix}${name}`;

    },


    save(name, value) {

        try {

            localStorage.setItem(
                this.key(name),
                JSON.stringify(value)
            );

            return true;

        } catch (error) {

            console.error(
                "Waeve storage save failed:",
                error
            );

            return false;

        }

    },


    load(name, fallback = null) {

        try {

            const value = localStorage.getItem(
                this.key(name)
            );

            if (value === null) {

                return fallback;

            }

            return JSON.parse(value);

        } catch (error) {

            console.error(
                "Waeve storage load failed:",
                error
            );

            return fallback;

        }

    },


    remove(name) {

        try {

            localStorage.removeItem(
                this.key(name)
            );

            return true;

        } catch (error) {

            console.error(
                "Waeve storage remove failed:",
                error
            );

            return false;

        }

    },


    clear() {

        const prefix =
            WAEVE_CONFIG.storage.prefix;

        const keys = [];

        for (
            let index = 0;
            index < localStorage.length;
            index++
        ) {

            const key =
                localStorage.key(index);

            if (
                key &&
                key.startsWith(prefix)
            ) {

                keys.push(key);

            }

        }

        keys.forEach(
            key => localStorage.removeItem(key)
        );

    }

};