#include <stdio.h>
#include <string.h> // CWE-120 (unsafe strcpy) and CWE-676 (dangerous strcat)

int main(void)
{
    // Declare volatile pointers to avoid inlining/builtin replacement
    volatile char *(*vstrcpy)(char *, const char *) = strcpy;
    volatile char *(*vstrcat)(char *, const char *) = strcat;

    char buf[4];
    vstrcpy((char *)buf, "OVERFLOW"); // CWE-119/120

    char msg[32] = "Hello ";
    vstrcat(msg, (char *)buf); // CWE-676

    printf("hello world – %s\n", msg);
    return 0;
}
