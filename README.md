# CDNObject

A **normal** front-end CDN object selector.

## Usage

```javascript
import '@chenyfan/cdnobject'
const CDNInstance = new CDNObject()
const CDNObjectClass = new CDNInstance("https://unpkg.com/@chenyfan/cdnobject/dist/index.min.js")
```

> You should import pako.ungzip if you wanna use GetFileFromNPMPackageFunction.

```javascript
import { ungzip } from "pako"
const CDNInstance = new CDNObject({ ungzip })
```
