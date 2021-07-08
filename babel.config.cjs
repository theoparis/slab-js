module.exports = {
    presets: [
        "@babel/typescript",
        [
            "@babel/env",
            {
                targets: {
                    browsers: ["last 2 versions"]
                }
            }
        ]
    ],
    plugins: [
        "@babel/proposal-class-properties",
        "@babel/proposal-object-rest-spread",
        [
            "@babel/plugin-transform-runtime",
            {
                helpers: true,
                regenerator: true
            }
        ]
    ]
};
