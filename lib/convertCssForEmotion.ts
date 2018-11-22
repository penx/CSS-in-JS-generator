import { convertScopedCssForEmotion } from "./convertScopedCssForEmotion";
import { convertScopeToModuleName } from "./convertScopeToModuleName";
import { getCssIndexedByScope } from "./getCssIndexedByScope";
import { getRequiredScopes } from "./getRequiredScopes";

export function convertCssForEmotion(css: string): string {
    let cssForEmotion = "";

    const cssIndexedByScope = getCssIndexedByScope(css);

    cssForEmotion += 'import styled from "@emotion/styled";\n';

    const knownScopes = new Set([...cssIndexedByScope.keys()]);

    const collator = new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: "base",
    });

    const sortedKnownScopes = [...knownScopes]
        .sort((scopeA, scopeB) => {
            if (scopeA === "root") {
                return -1;
            }

            return collator.compare(scopeA, scopeB);
        })
        .reduce((previousSortedKnownScopes: Set<string>, knownScope) => {
            getRequiredScopes(
                cssIndexedByScope.get(knownScope) as string,
                knownScope,
                knownScopes,
            ).forEach((requiredScope) => {
                if (previousSortedKnownScopes.has(requiredScope) === false) {
                    previousSortedKnownScopes.add(requiredScope);
                }
            });

            if (previousSortedKnownScopes.has(knownScope) === false) {
                previousSortedKnownScopes.add(knownScope);
            }

            return previousSortedKnownScopes;
        }, new Set());

    sortedKnownScopes.forEach((scope) => {
        cssForEmotion += "\n";

        const convertedScopedCssForEmotion = convertScopedCssForEmotion(
            cssIndexedByScope.get(scope) as string,
            scope,
            knownScopes,
        );

        if (scope === "root") {
            // cssForEmotion += `injectGlobal\`${convertedScopedCssForEmotion}\`;\n`;
        } else {
            cssForEmotion += `export const ${convertScopeToModuleName(
                scope,
            )} = styled('div')\`${convertedScopedCssForEmotion}\`;\n`;
        }
    });

    return cssForEmotion;
}
