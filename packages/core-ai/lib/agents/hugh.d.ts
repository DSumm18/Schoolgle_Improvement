import { AgentBase } from './agent';
import { type TranslationDetails } from '../actions/actionRegistry';
/**
 * @class HughAgent
 * The persona for handling language translation tasks.
 */
export declare class HughAgent extends AgentBase {
    constructor();
    /**
    * Translates a given text to a target language using the action registry.
    * @param details The text and target language for translation.
    * @returns The result from the translateMessage skill.
    */
    translate(details: TranslationDetails): Promise<{
        success: boolean;
        message: string;
    }>;
}
export declare const hughAgent: HughAgent;
