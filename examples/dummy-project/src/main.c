#include <stdio.h>
#include <string.h>

int main(void)
{
    volatile char *(*vstrcpy)(char *, const char *) = strcpy;
    volatile char *(*vstrcat)(char *, const char *) = strcat;

    char buf[4];
    vstrcpy((char *)buf, "OVERFLOW");

    char msg[32] = "Hello ";
    vstrcat(msg, (char *)buf);

    printf("hello world – %s\n", msg); // CWE-134 (unsafe printf)
    return 0;
}
