import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Clock } from "lucide-react"

export default function HistoryPage() {
    return (
        <div className="flex flex-col p-8 h-full space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Generation History</h2>
                <p className="text-muted-foreground">
                    View previously generated AI workflow JSONs.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Placeholder cards for history items */}
                {[1, 2, 3].map((item) => (
                    <Card key={item} className="opacity-70 hover:opacity-100 transition-opacity">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center justify-between">
                                <span>OTP Flow #{item}</span>
                                <Clock className="w-4 h-4 text-muted-foreground" />
                            </CardTitle>
                            <CardDescription>Generated an hour ago</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                User prompt: Create an OTP verification flow with WhatsApp fallback...
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
