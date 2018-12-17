/**
 * reuse-strategy.ts
 * by corbfon 1/6/17
 */

import { ActivatedRouteSnapshot, RouteReuseStrategy, DetachedRouteHandle, OutletContext } from '@angular/router';
/** Interface for object which can store both: 
 * An ActivatedRouteSnapshot, which is useful for determining whether or not you should attach a route (see this.shouldAttach)
 * A DetachedRouteHandle, which is offered up by this.retrieve, in the case that you do want to attach the stored route
 */
interface RouteStorageObject {
    snapshot: ActivatedRouteSnapshot;
    handle: DetachedRouteHandle;
}

export class CustomReuseStrategy implements RouteReuseStrategy {

    /** 
  * Object which will store RouteStorageObjects indexed by keys
  * The keys will all be a path (as in route.routeConfig.path)
  * This allows us to see if we've got a route stored for the requested path
  */
    storedRoutes: { [key: string]: RouteStorageObject } = {};

    shouldDetach(route: ActivatedRouteSnapshot): boolean {
        if (!route.routeConfig || route.routeConfig.loadChildren) {
            return false;
        }
        /** Whether this route should be re used or not */
        let shouldReuse = false;
        console.log('[router-reuse] checking if this route should be re used or not', route);
        if (route.routeConfig.data) {
            route.routeConfig.data.reuse ? shouldReuse = true : shouldReuse = false;
        }

        return shouldReuse;
    }
    store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
        let storedRoute: RouteStorageObject = {
            snapshot: route,
            handle: handle
        };

        console.log("store:", storedRoute, "into: ", this.storedRoutes);
        // routes are stored by path - the key is the path name, and the handle is stored under it so that you can only ever have one object stored for a single path
        this.storedRoutes[route.routeConfig.path] = storedRoute;
    }
    shouldAttach(route: ActivatedRouteSnapshot): boolean {  // this will be true if the route has been stored before
        if (route.routeConfig.data && route.routeConfig.data.destroy) {
            this.storedRoutes = {};
            return false;
        }
        let requestedPath = route.routeConfig.path;
        let existingpath=this.storedRoutes[route.routeConfig.path]
        let canAttach: boolean = !!route.routeConfig && !!this.storedRoutes[route.routeConfig.path] && existingpath.snapshot.component==route.routeConfig.component;

        // this decides whether the route already stored should be rendered in place of the requested route, and is the return value
        // at this point we already know that the paths match because the storedResults key is the route.routeConfig.path
        // so, if the route.params and route.queryParams also match, then we should reuse the component
        if (canAttach) {
            let willAttach: boolean = true;
            console.log("param comparison:");
            console.log(this.compareObjects(route.params, this.storedRoutes[route.routeConfig.path].snapshot.params));
            console.log("query param comparison");
            console.log(this.compareObjects(route.queryParams, this.storedRoutes[route.routeConfig.path].snapshot.queryParams));

            let paramsMatch: boolean = this.compareObjects(route.params, this.storedRoutes[route.routeConfig.path].snapshot.params);
            let queryParamsMatch: boolean = this.compareObjects(route.queryParams, this.storedRoutes[route.routeConfig.path].snapshot.queryParams);

            console.log("deciding to attach...", route, "does it match?", this.storedRoutes[route.routeConfig.path].snapshot, "return: ", paramsMatch && queryParamsMatch);
            return paramsMatch && queryParamsMatch;
        } else {
            return false;
        }
    }
    retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {

        // return null if the path does not have a routerConfig OR if there is no stored route for that routerConfig
        if (!route.routeConfig || !this.storedRoutes[route.routeConfig.path]) return null;
        console.log("retrieving", "return: ", this.storedRoutes[route.routeConfig.path]);

        /** returns handle when the route.routeConfig.path is already stored */
        let requestedPath = route.routeConfig.path;
        let existingpath=this.storedRoutes[route.routeConfig.path]
        if(existingpath.snapshot.component==route.routeConfig.component)
        return this.storedRoutes[route.routeConfig.path].handle;
    }

    shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {

        let reUseUrl = false;

        if (future.routeConfig) {
            if (future.routeConfig.data) {
                reUseUrl = future.routeConfig.data.reuse;
            }
        }
        return future.routeConfig === curr.routeConfig || reUseUrl;
    }

    private compareObjects(base: any, compare: any): boolean {

        // loop through all properties in base object
        for (let baseProperty in base) {

            // determine if comparrison object has that property, if not: return false
            if (compare.hasOwnProperty(baseProperty)) {
                switch (typeof base[baseProperty]) {
                    // if one is object and other is not: return false
                    // if they are both objects, recursively call this comparison function
                    case 'object':
                        if (typeof compare[baseProperty] !== 'object' || !this.compareObjects(base[baseProperty], compare[baseProperty])) { return false; } break;
                    // if one is function and other is not: return false
                    // if both are functions, compare function.toString() results
                    case 'function':
                        if (typeof compare[baseProperty] !== 'function' || base[baseProperty].toString() !== compare[baseProperty].toString()) { return false; } break;
                    // otherwise, see if they are equal using coercive comparison
                    default:
                        if (base[baseProperty] != compare[baseProperty]) { return false; }
                }
            } else {
                return false;
            }
        }

        // returns true only after false HAS NOT BEEN returned through all loops
        return true;
    }
}