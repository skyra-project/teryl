import { FT, T } from '@skyra/http-framework-i18n';

// Root
export const RootName = T('commands/unicode:name');
export const RootDescription = T('commands/unicode:description');

export const Inspect = 'commands/unicode:inspect';
export const Search = 'commands/unicode:search';

export const OptionsCharacter = 'commands/unicode:optionsCharacter';
export const OptionsCategory = 'commands/unicode:optionsCategory';
export const OptionsBidirectionalCategory = 'commands/unicode:optionsBidirectionalCategory';
export const OptionsClass = 'commands/unicode:optionsClass';

export const InformationBasic = FT<{ name: string; category: string; bidirectionalCategory: string; class: string }>(
	'commands/unicode:informationBasic'
);
export const InformationValue = FT<{ value: number }>('commands/unicode:informationValue');
export const InformationMirrored = T('commands/unicode:informationMirrored');
export const InformationMappingBase = FT<{ value: string }>('commands/unicode:informationMappingBase');
export const InformationMappingLowercase = FT<{ value: string }>('commands/unicode:informationMappingLowercase');
export const InformationMappingUppercase = FT<{ value: string }>('commands/unicode:informationMappingUppercase');
export const InformationComment = FT<{ value: string }>('commands/unicode:informationComment');
export const TooManyCharacters = T('commands/unicode:tooManyCharacters');
export const UnknownCharacter = T('commands/unicode:unknownCharacter');

export const SelectMenuOptionLabel = FT<{ page: number; characters: string }>('commands/unicode:selectMenuOptionLabel');

export const CategoryControl = T('commands/unicode:categoryControl');
export const CategoryFormat = T('commands/unicode:categoryFormat');
export const CategoryPrivateUse = T('commands/unicode:categoryPrivateUse');
export const CategorySurrogate = T('commands/unicode:categorySurrogate');
export const CategoryLowercaseLetter = T('commands/unicode:categoryLowercaseLetter');
export const CategoryModifierLetter = T('commands/unicode:categoryModifierLetter');
export const CategoryOtherLetter = T('commands/unicode:categoryOtherLetter');
export const CategoryTitlecaseLetter = T('commands/unicode:categoryTitlecaseLetter');
export const CategoryUppercaseLetter = T('commands/unicode:categoryUppercaseLetter');
export const CategorySpacingMark = T('commands/unicode:categorySpacingMark');
export const CategoryEnclosingMark = T('commands/unicode:categoryEnclosingMark');
export const CategoryNonspacingMark = T('commands/unicode:categoryNonspacingMark');
export const CategoryDecimalNumber = T('commands/unicode:categoryDecimalNumber');
export const CategoryLetterNumber = T('commands/unicode:categoryLetterNumber');
export const CategoryOtherNumber = T('commands/unicode:categoryOtherNumber');
export const CategoryConnectorPunctuation = T('commands/unicode:categoryConnectorPunctuation');
export const CategoryDashPunctuation = T('commands/unicode:categoryDashPunctuation');
export const CategoryClosePunctuation = T('commands/unicode:categoryClosePunctuation');
export const CategoryFinalPunctuation = T('commands/unicode:categoryFinalPunctuation');
export const CategoryInitialPunctuation = T('commands/unicode:categoryInitialPunctuation');
export const CategoryOtherPunctuation = T('commands/unicode:categoryOtherPunctuation');
export const CategoryOpenPunctuation = T('commands/unicode:categoryOpenPunctuation');
export const CategoryCurrencySymbol = T('commands/unicode:categoryCurrencySymbol');
export const CategoryModifierSymbol = T('commands/unicode:categoryModifierSymbol');
export const CategoryMathSymbol = T('commands/unicode:categoryMathSymbol');
export const CategoryOtherSymbol = T('commands/unicode:categoryOtherSymbol');
export const CategoryLineSeparator = T('commands/unicode:categoryLineSeparator');
export const CategoryParagraphSeparator = T('commands/unicode:categoryParagraphSeparator');
export const CategorySpaceSeparator = T('commands/unicode:categorySpaceSeparator');

export const CategoryGroupMark = T('commands/unicode:categoryGroupMark');
export const CategoryGroupPunctuation = T('commands/unicode:categoryGroupPunctuation');
export const CategoryGroupSeparator = T('commands/unicode:categoryGroupSeparator');

export const CategoryBidirectionalArabicLetter = T('commands/unicode:categoryBidirectionalArabicLetter');
export const CategoryBidirectionalArabicNumber = T('commands/unicode:categoryBidirectionalArabicNumber');
export const CategoryBidirectionalParagraphSeparator = T('commands/unicode:categoryBidirectionalParagraphSeparator');
export const CategoryBidirectionalBoundaryNeutral = T('commands/unicode:categoryBidirectionalBoundaryNeutral');
export const CategoryBidirectionalCommonSeparator = T('commands/unicode:categoryBidirectionalCommonSeparator');
export const CategoryBidirectionalEuropeanNumber = T('commands/unicode:categoryBidirectionalEuropeanNumber');
export const CategoryBidirectionalEuropeanSeparator = T('commands/unicode:categoryBidirectionalEuropeanSeparator');
export const CategoryBidirectionalEuropeanTerminator = T('commands/unicode:categoryBidirectionalEuropeanTerminator');
export const CategoryBidirectionalFirstStrongIsolate = T('commands/unicode:categoryBidirectionalFirstStrongIsolate');
export const CategoryBidirectionalLeftToRight = T('commands/unicode:categoryBidirectionalLeftToRight');
export const CategoryBidirectionalLeftToRightEmbedding = T('commands/unicode:categoryBidirectionalLeftToRightEmbedding');
export const CategoryBidirectionalLeftToRightIsolate = T('commands/unicode:categoryBidirectionalLeftToRightIsolate');
export const CategoryBidirectionalLeftToRightOverride = T('commands/unicode:categoryBidirectionalLeftToRightOverride');
export const CategoryBidirectionalNonSpacingMark = T('commands/unicode:categoryBidirectionalNonSpacingMark');
export const CategoryBidirectionalOtherNeutral = T('commands/unicode:categoryBidirectionalOtherNeutral');
export const CategoryBidirectionalPopDirectionalFormat = T('commands/unicode:categoryBidirectionalPopDirectionalFormat');
export const CategoryBidirectionalPopDirectionalIsolate = T('commands/unicode:categoryBidirectionalPopDirectionalIsolate');
export const CategoryBidirectionalRightToLeft = T('commands/unicode:categoryBidirectionalRightToLeft');
export const CategoryBidirectionalRightToLeftEmbedding = T('commands/unicode:categoryBidirectionalRightToLeftEmbedding');
export const CategoryBidirectionalRightToLeftIsolate = T('commands/unicode:categoryBidirectionalRightToLeftIsolate');
export const CategoryBidirectionalRightToLeftOverride = T('commands/unicode:categoryBidirectionalRightToLeftOverride');
export const CategoryBidirectionalSegmentSeparator = T('commands/unicode:categoryBidirectionalSegmentSeparator');
export const CategoryBidirectionalWhiteSpace = T('commands/unicode:categoryBidirectionalWhiteSpace');

export const ClassNotReordered = T('commands/unicode:classNotReordered');
export const ClassOverlay = T('commands/unicode:classOverlay');
export const ClassUnnamed = T('commands/unicode:classUnnamed');
export const ClassNukta = T('commands/unicode:classNukta');
export const ClassKanaVoicing = T('commands/unicode:classKanaVoicing');
export const ClassVirama = T('commands/unicode:classVirama');
export const ClassAttachedBelow = T('commands/unicode:classAttachedBelow');
export const ClassAttachedAbove = T('commands/unicode:classAttachedAbove');
export const ClassAttachedAboveRight = T('commands/unicode:classAttachedAboveRight');
export const ClassBelowLeft = T('commands/unicode:classBelowLeft');
export const ClassBelow = T('commands/unicode:classBelow');
export const ClassBelowRight = T('commands/unicode:classBelowRight');
export const ClassLeft = T('commands/unicode:classLeft');
export const ClassRight = T('commands/unicode:classRight');
export const ClassAboveLeft = T('commands/unicode:classAboveLeft');
export const ClassAbove = T('commands/unicode:classAbove');
export const ClassAboveRight = T('commands/unicode:classAboveRight');
export const ClassDoubleBelow = T('commands/unicode:classDoubleBelow');
export const ClassDoubleAbove = T('commands/unicode:classDoubleAbove');
export const ClassIotaSubscript = T('commands/unicode:classIotaSubscript');
