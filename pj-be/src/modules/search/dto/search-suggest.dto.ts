export class ServiceSuggestResponseDto {
    service!: { id: number; name: string; url: string }[];
    spa!: { id: number; name: string; url: string }[];
    deal!: { id: number; name: string; url: string }[];
    location!: { id: number; name: string; url: string }[];
}