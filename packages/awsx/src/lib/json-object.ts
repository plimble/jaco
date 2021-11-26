export function JSONObject<T = any>(data: any): T {
    if (Array.isArray(data)) {
        const newArray: any = []
        for (const item of data) {
            if (item !== undefined) {
                newArray.push(JSONObject(item))
            }
        }

        return newArray
    } else if (data === Object(data)) {
        if (data.toJSON) {
            return JSONObject(data.toJSON())
        } else {
            const newData: any = {}
            for (const [key, val] of Object.entries(data)) {
                if (val !== undefined) {
                    newData[key] = JSONObject(val)
                }
            }

            return newData
        }
    }

    if (data) {
        return data.toJSON ? data.toJSON() : data
    }

    return data
}
