import { Breadcrumb, vehicleConfig } from "./models";

export const testOverload = (config: vehicleConfig, data: Breadcrumb[]) => {
    const bridge = (config.length * 2.1) + 18
    const limit = Math.min(config.max_weight, bridge)
    return data[0].gross_payload > limit
}