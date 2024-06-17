export default async (reqs) => {
    return new Promise(async (resolve, reject) => {
        const abortEvent = new Event("abortOtherInstance")
        const eventTarget = new EventTarget();
        const error_fallback = setTimeout(() => {
            reject(new Response('504 All GateWays Failed', { status: 504, statusText: '504 All Gateways Timeout' }))
        }, 5000)
        await Promise.any(reqs.map(async req => {
            if (typeof req === 'string') req = new Request(req)
            let controller = new AbortController(), tagged = false;
            eventTarget.addEventListener(abortEvent.type, () => {
                if (!tagged) controller.abort()
            })
            fetch(req, {
                signal: controller.signal,
                mode: "cors",
                redirect: "follow"
            }).then(res => {
                if (res.status === 200) {
                    tagged = true;
                    eventTarget.dispatchEvent(abortEvent)
                    clearTimeout(error_fallback)
                    resolve(res.clone())
                }
            }).catch(err => {
                if (err == 'DOMException: The user aborted a request.') console.log()//To disable the warning:DOMException: The user aborted a request.
            })
        })).catch(err => {
            reject(err)
        })
    })
}