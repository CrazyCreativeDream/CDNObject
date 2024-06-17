export default [
    {
        match: "(cdn|fastly)\\.jsdelivr\\.net",
        domain: "cdn.jsdelivr.net",
        concat: {
            "npm": "/npm(/@{{PACKAGE_SCOPE}})?/({{PACKAGE_NAME}})(@{{PACKAGE_VERSION}})?(/{{$FILE_PATH}})?",
            "github": "/gh/({{USER_NAME}})/({{REPO_NAME}})(@{{TAG_NAME}})?(/{{$FILE_PATH}})?"
        }
    },
    {
        match: "registry\\.npmmirror\\.com",
        domain: "registry.npmmirror.com",
        concat: {
            "npm": "(/@{{PACKAGE_SCOPE}})?/({{PACKAGE_NAME}})(/{{PACKAGE_VERSION}})?/files(/{{$FILE_PATH}})?",//white list required
        },
        extra: {
            "npm_meta": "(/@{{PACKAGE_SCOPE}})?/({{PACKAGE_NAME}})(/{{$PACKAGE_VERSION}})?",
            "npm_registry": "(@{{PACKAGE_SCOPE}})?/({{PACKAGE_NAME}})/-/({{PACKAGE_NAME}})-({{PACKAGE_VERSION}}).tgz"
        }
    },
    {
        match: "registry\\.npmjs\\.org",
        domain: "registry.npmjs.org",
        concat: {},
        extra: {
            "npm_meta": "(/@{{PACKAGE_SCOPE}})?/({{PACKAGE_NAME}})(/{{$PACKAGE_VERSION}})?",
            "npm_registry": "(@{{PACKAGE_SCOPE}})?/({{PACKAGE_NAME}})/-/({{PACKAGE_NAME}})-({{PACKAGE_VERSION}}).tgz"
        }
    }
    // {
    //     match: "cdnjs\\.cloudflare\\.com",
    //     domain: "cdnjs.cloudflare.com",
    //     concat: {
    //         "cdnjs": "/ajax/libs/{{PACKAGE_NAME}}/{{PACKAGE_VERSION}}/{{FILE_PATH}}"
    //     }
    // },
    // {
    //     match: "cdn\\.bootcdn\\.net",
    //     domain: "cdn.bootcdn.net",
    //     concat: {
    //         "cdnjs": "/ajax/libs/{{PACKAGE_NAME}}/{{PACKAGE_VERSION}}/{{FILE_PATH}}"
    //     }
    // },
    // {
    //     match: "unpkg\\.com",
    //     domain: "unpkg.com",
    //     concat: {
    //         "npm": "(|/@{{PACKAGE_NAME}})/{{PACKAGE_NAME}}(|@{{PACKAGE_VERSION}})/{{FILE_PATH}}"
    //     }
    // },
    // {
    //     match: "cdn\\.staticfile\\.org",
    //     domain: "cdn.staticfile.org",
    //     concat: {
    //         "cdnjs": "/ajax/libs/{{PACKAGE_NAME}}/{{PACKAGE_VERSION}}/{{FILE_PATH}}"
    //     }
    // },
    // {


]