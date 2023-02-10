export const PathRoot = new URL('../../..', import.meta.url);
export const PathAssets = new URL('./assets/', PathRoot);
export const PathSrc = new URL('./src/', PathRoot);

export const enum BrandingColors {
	Primary = 0x6b79c9,
	Secondary = 0xd4b8a3
}

export const enum EmbedColors {
	Error = 0xff1744
}

export const enum Emojis {
	MessageAttachmentIcon = '<:MessageAttachmentIcon:1006096566270033940>',
	MessageLinkIcon = '<:MessageLinkIcon:1006096849201016852>',
	MessagePinIcon = '<:MessagePinIcon:1006096836882337822>',
	MessageIconSlashCommandsIcon = '<:MessageIconSlashCommandsIcon:1006096757937143818> ',
	IdIcon = '<:IdIcon:1006096811917836339>',
	OwlbotIcon = '<:Owlbot:1011001367499919363>'
}
