import * as commandpost from 'commandpost';
import * as c from 'commandpost';

export let cmdErrors: { [key: string]: (err: c.CommandpostError) => string } = {};
cmdErrors[c.ErrorReason.ArgumentRequired] = (err) => `Argument ${err.params.parts[0]} is required.`;
cmdErrors[c.ErrorReason.ArgumentsRequired] = (err) => `Arguments ${err.params.parts.join(', ')} are required.`;
cmdErrors[c.ErrorReason.OptionNameMismatch] = (err) => `Option name ${err.params.parts[0]} doesn't match.`;
cmdErrors[c.ErrorReason.OptionValueRequired] = (err) => `Value required for option ${err.params.parts[0]}.`;
cmdErrors[c.ErrorReason.ParameterCannPlacedAfterOptional] = (err) => `Parameter ${err.params.parts[0]} cannot be placed after optional parameter.`;
cmdErrors[c.ErrorReason.ParameterCantPlacedAfterVariadic] = (err) => `Parameter ${err.params.parts[0]} cannot be placed after optional parameter.`;
cmdErrors[c.ErrorReason.UnknownOption] = (err) => `Option(s) ${err.params.parts.join(', ')} are unknown.`;
cmdErrors[c.ErrorReason.UnsupportedFormatArgument] = (err) => `Internal error. Unsupported format: ${err.params.parts[0]}.`;
